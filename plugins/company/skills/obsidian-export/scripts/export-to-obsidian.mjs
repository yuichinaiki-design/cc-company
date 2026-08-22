#!/usr/bin/env node
/**
 * export-to-obsidian.mjs
 *
 * Claude に溜まった情報（.company/ の組織データ、CLAUDE.md メモリ、
 * ユーザー定義スキル、会話履歴）を Obsidian Vault へコピーする。
 *
 * - 追記型: Vault のファイルは削除しない
 * - 衝突検知: Vault 側で手編集されたノートは上書きせずスキップ（--force で上書き）
 * - 差分同期: 前回と内容が同じソースは書き込まない
 *
 * Usage:
 *   node export-to-obsidian.mjs --vault <path> [options]
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const CATEGORIES = ["company", "memory", "custom", "history"];
const DEFAULT_INCLUDE = ["company", "memory", "custom"];
const TEXT_EXT = new Set([
  ".md", ".markdown", ".txt", ".json", ".yaml", ".yml", ".csv", ".toml",
]);
const SKIP_DIRS = new Set([".git", "node_modules", ".obsidian", ".DS_Store", ".sync"]);
const MAX_BYTES = 5 * 1024 * 1024;

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const opts = {
    vault: null,
    source: process.cwd(),
    subfolder: "Claude",
    include: null,
    claudeHome: process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude"),
    dryRun: false,
    force: false,
    json: false,
    history: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} には値が必要です`);
      return v;
    };
    switch (a) {
      case "--vault": opts.vault = next(); break;
      case "--source": opts.source = next(); break;
      case "--subfolder": opts.subfolder = next(); break;
      case "--include": opts.include = next().split(",").map((s) => s.trim()).filter(Boolean); break;
      case "--claude-home": opts.claudeHome = next(); break;
      case "--history": opts.history = true; break;
      case "--dry-run": opts.dryRun = true; break;
      case "--force": opts.force = true; break;
      case "--json": opts.json = true; break;
      case "-h": case "--help": opts.help = true; break;
      default: throw new Error(`不明なオプション: ${a}`);
    }
  }
  const include = opts.include ?? [...DEFAULT_INCLUDE];
  if (opts.history && !include.includes("history")) include.push("history");
  const bad = include.filter((c) => !CATEGORIES.includes(c));
  if (bad.length) throw new Error(`--include に不明なカテゴリ: ${bad.join(", ")}`);
  opts.include = include;
  return opts;
}

// ---------------------------------------------------------------- utils

const sha = (buf) =>
  crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);

const exists = (p) => {
  try { fs.accessSync(p); return true; } catch { return false; }
};

const isDir = (p) => {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
};

/** ディレクトリを再帰的に走査してファイルの相対パス一覧を返す */
function walk(root, rel = "") {
  const out = [];
  const abs = path.join(root, rel);
  let entries;
  try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { return out; }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP_DIRS.has(e.name)) continue;
    const r = rel ? path.join(rel, e.name) : e.name;
    if (e.isDirectory()) out.push(...walk(root, r));
    else if (e.isFile()) out.push(r);
  }
  return out;
}

/** Obsidian の Wikilink 用にパスを整える（Vault ルート相対・拡張子なし） */
const wikilink = (vaultRelPath, label) => {
  const target = vaultRelPath.replace(/\\/g, "/").replace(/\.md$/, "");
  return label && label !== path.basename(target)
    ? `[[${target}|${label}]]`
    : `[[${target}]]`;
};

/** ファイル名として安全な文字列にする */
const slugify = (s) =>
  s
    .replace(/[<>:"/\\|?*#^[\]]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled";

/** 先頭の YAML frontmatter を分離する */
function splitFrontmatter(text) {
  if (!text.startsWith("---\n")) return { fm: null, body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { fm: null, body: text };
  const after = text.indexOf("\n", end + 1);
  return {
    fm: text.slice(4, end),
    body: after === -1 ? "" : text.slice(after + 1),
  };
}

const yamlStr = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/**
 * 元の frontmatter を残しつつ claude-* メタデータを付与したノート本文を作る。
 * 元の frontmatter の claude-* 行は再生成のため取り除く。
 */
function buildNote({ content, sourceLabel, origin, tags, syncedAt }) {
  const { fm, body } = splitFrontmatter(content);
  const kept = (fm ?? "")
    .split("\n")
    .filter((line) => !/^claude-[a-z-]+\s*:/.test(line))
    .filter((line) => line.trim() !== "");
  const hasTags = kept.some((line) => /^tags\s*:/.test(line));
  const meta = [
    ...kept,
    `claude-source: ${yamlStr(sourceLabel)}`,
    `claude-origin: ${origin}`,
    `claude-synced: ${yamlStr(syncedAt)}`,
  ];
  if (!hasTags && tags.length) meta.push(`tags: [${tags.join(", ")}]`);
  return `---\n${meta.join("\n")}\n---\n\n${body.replace(/^\n+/, "")}`;
}

// ---------------------------------------------------------------- manifest

function loadManifest(manifestPath) {
  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (raw && typeof raw.files === "object") return raw;
  } catch { /* 初回、または壊れている場合は作り直す */ }
  return { version: 1, files: {} };
}

// ---------------------------------------------------------------- writer

function createWriter(opts, vaultRoot, outRoot, manifest) {
  const stats = { written: 0, updated: 0, skipped: 0, index: 0, conflicts: [], errors: [] };
  const syncedAt = new Date().toISOString();

  /**
   * @param relPath    outRoot からの相対パス
   * @param payload    Buffer | string（最終的なノート内容）
   * @param sourceHash ソース側の内容ハッシュ（差分判定用）
   * @param isIndex    MOC（索引ノート）なら true。集計を分けて数える
   */
  function write(relPath, payload, sourceHash, isIndex = false) {
    const destAbs = path.join(outRoot, relPath);
    const vaultRel = path.relative(vaultRoot, destAbs).replace(/\\/g, "/");
    const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, "utf8");
    const record = manifest.files[vaultRel];

    const commit = () => {
      if (opts.dryRun) return;
      fs.mkdirSync(path.dirname(destAbs), { recursive: true });
      fs.writeFileSync(destAbs, buf);
      manifest.files[vaultRel] = { sourceHash, vaultHash: sha(buf), syncedAt };
    };

    if (exists(destAbs)) {
      const current = fs.readFileSync(destAbs);
      const currentHash = sha(current);
      const handEdited = !record || currentHash !== record.vaultHash;

      if (!handEdited && record.sourceHash === sourceHash) {
        if (!isIndex) stats.skipped++;
        return { vaultRel, action: "skip" };
      }
      if (handEdited && !opts.force) {
        stats.conflicts.push(vaultRel);
        return { vaultRel, action: "conflict" };
      }
      if (currentHash === sha(buf)) {
        if (!opts.dryRun) manifest.files[vaultRel] = { sourceHash, vaultHash: currentHash, syncedAt };
        if (!isIndex) stats.skipped++;
        return { vaultRel, action: "skip" };
      }
      commit();
      if (isIndex) stats.index++;
      else stats.updated++;
      return { vaultRel, action: "update" };
    }

    commit();
    if (isIndex) stats.index++;
    else stats.written++;
    return { vaultRel, action: "create" };
  }

  return { write, stats, syncedAt };
}

// ---------------------------------------------------------------- collectors

/** ソースファイル1件を Vault ノートに変換して書き出す */
function copyFile({ srcAbs, destRel, sourceLabel, origin, tags, writer }) {
  let stat;
  try { stat = fs.statSync(srcAbs); } catch { return null; }
  if (stat.size > MAX_BYTES) {
    writer.stats.errors.push(`${sourceLabel}: 5MB を超えるためスキップしました`);
    return null;
  }
  const ext = path.extname(srcAbs).toLowerCase();
  const raw = fs.readFileSync(srcAbs);
  const sourceHash = sha(raw);

  if (ext === ".md" || ext === ".markdown") {
    const note = buildNote({
      content: raw.toString("utf8"),
      sourceLabel,
      origin,
      tags,
      syncedAt: writer.syncedAt,
    });
    const res = writer.write(destRel, note, sourceHash);
    return { ...res, title: path.basename(destRel, path.extname(destRel)) };
  }

  if (TEXT_EXT.has(ext)) {
    // md 以外のテキストはコードブロックで包んで .md 化する（Obsidian で読めるように）
    const lang = ext.replace(".", "");
    const fence = "```";
    const body = `# ${path.basename(srcAbs)}\n\n${fence}${lang}\n${raw.toString("utf8")}\n${fence}\n`;
    const note = buildNote({
      content: body,
      sourceLabel,
      origin,
      tags,
      syncedAt: writer.syncedAt,
    });
    const res = writer.write(`${destRel}.md`, note, sourceHash);
    return { ...res, title: path.basename(srcAbs) };
  }

  // バイナリ（画像など）はそのままコピー
  const res = writer.write(destRel, raw, sourceHash);
  return { ...res, title: path.basename(destRel), binary: true };
}

function collectCompany(opts, writer) {
  const companyDir = path.join(opts.source, ".company");
  if (!isDir(companyDir)) return { available: false, notes: [] };
  const notes = [];
  for (const rel of walk(companyDir)) {
    const r = copyFile({
      srcAbs: path.join(companyDir, rel),
      destRel: path.join("company", rel),
      sourceLabel: path.join(".company", rel),
      origin: "company",
      tags: ["claude", "company", slugify(rel.split(path.sep)[0])],
      writer,
    });
    if (r) notes.push(r);
  }
  return { available: true, notes };
}

function collectMemory(opts, writer) {
  const notes = [];
  const projectSlug = slugify(path.basename(opts.source));
  const candidates = [
    {
      abs: path.join(opts.claudeHome, "CLAUDE.md"),
      dest: "memory/global-CLAUDE.md",
      label: "~/.claude/CLAUDE.md",
    },
    {
      abs: path.join(opts.source, "CLAUDE.md"),
      dest: `memory/${projectSlug}-CLAUDE.md`,
      label: "CLAUDE.md",
    },
    {
      abs: path.join(opts.source, ".claude", "CLAUDE.md"),
      dest: `memory/${projectSlug}-local-CLAUDE.md`,
      label: ".claude/CLAUDE.md",
    },
  ];
  for (const c of candidates) {
    if (!exists(c.abs)) continue;
    const r = copyFile({
      srcAbs: c.abs,
      destRel: c.dest,
      sourceLabel: c.label,
      origin: "memory",
      tags: ["claude", "memory"],
      writer,
    });
    if (r) notes.push(r);
  }
  return { available: notes.length > 0, notes };
}

function collectCustom(opts, writer) {
  const notes = [];
  const roots = [
    { dir: path.join(opts.claudeHome, "skills"), kind: "skills", scope: "global" },
    { dir: path.join(opts.claudeHome, "agents"), kind: "agents", scope: "global" },
    { dir: path.join(opts.claudeHome, "commands"), kind: "commands", scope: "global" },
    { dir: path.join(opts.source, ".claude", "skills"), kind: "skills", scope: "project" },
    { dir: path.join(opts.source, ".claude", "agents"), kind: "agents", scope: "project" },
    { dir: path.join(opts.source, ".claude", "commands"), kind: "commands", scope: "project" },
  ];
  for (const root of roots) {
    if (!isDir(root.dir)) continue;
    for (const rel of walk(root.dir)) {
      const r = copyFile({
        srcAbs: path.join(root.dir, rel),
        destRel: path.join("custom", root.kind, root.scope, rel),
        sourceLabel: path.join(root.scope === "global" ? "~/.claude" : ".claude", root.kind, rel),
        origin: "custom",
        tags: ["claude", root.kind, root.scope],
        writer,
      });
      if (r) notes.push(r);
    }
  }
  return { available: notes.length > 0, notes };
}

// ---- 会話履歴 (JSONL → Markdown トランスクリプト)

function renderContent(content) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  const parts = [];
  for (const block of content) {
    // thinking ブロックは記録しない（本文がないターンは後段で捨てられる）
    if (block?.type === "text" && block.text) parts.push(block.text.trim());
    else if (block?.type === "tool_use") parts.push(`> 🔧 **${block.name}** を実行`);
  }
  return parts.filter(Boolean).join("\n\n");
}

function renderTranscript(jsonlPath) {
  let lines;
  try { lines = fs.readFileSync(jsonlPath, "utf8").split("\n"); } catch { return null; }
  const turns = [];
  let meta = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (!meta && o.cwd) {
      meta = { cwd: o.cwd, sessionId: o.sessionId, gitBranch: o.gitBranch, start: o.timestamp };
    }
    if (o.isSidechain) continue;
    if (o.type !== "user" && o.type !== "assistant") continue;
    const text = renderContent(o.message?.content);
    if (!text) continue;
    turns.push({ role: o.type, text, ts: o.timestamp });
  }
  if (!turns.length) return null;
  const firstUser = turns.find((t) => t.role === "user");
  const title =
    (firstUser?.text ?? "session").split("\n")[0].replace(/^[#>\s-]+/, "").slice(0, 60) || "session";
  const start = meta?.start ?? turns[0].ts ?? new Date().toISOString();
  const date = start.slice(0, 10);
  const body = turns
    .map((t) => {
      const who = t.role === "user" ? "🧑 User" : "🤖 Claude";
      const time = t.ts ? ` <sub>${t.ts.slice(11, 16)}</sub>` : "";
      return `### ${who}${time}\n\n${t.text}`;
    })
    .join("\n\n---\n\n");
  const header =
    `# ${title}\n\n` +
    `- **日時**: ${date}\n` +
    `- **プロジェクト**: \`${meta?.cwd ?? "unknown"}\`\n` +
    (meta?.gitBranch ? `- **ブランチ**: \`${meta.gitBranch}\`\n` : "") +
    `- **セッション**: \`${meta?.sessionId ?? path.basename(jsonlPath, ".jsonl")}\`\n\n`;
  return { title, date, turns: turns.length, meta, markdown: `${header}---\n\n${body}\n` };
}

function collectHistory(opts, writer) {
  const projectsDir = path.join(opts.claudeHome, "projects");
  if (!isDir(projectsDir)) return { available: false, notes: [] };
  const notes = [];
  for (const projectKey of fs.readdirSync(projectsDir).sort()) {
    const projectDir = path.join(projectsDir, projectKey);
    if (!isDir(projectDir)) continue;
    for (const file of fs.readdirSync(projectDir).sort()) {
      if (!file.endsWith(".jsonl")) continue;
      const t = renderTranscript(path.join(projectDir, file));
      if (!t) continue;
      const sid = path.basename(file, ".jsonl").slice(0, 8);
      const destRel = path.join(
        "history",
        slugify(projectKey.replace(/^-/, "")),
        `${t.date}-${slugify(t.title)}-${sid}.md`
      );
      const note = buildNote({
        content: t.markdown,
        sourceLabel: `~/.claude/projects/${projectKey}/${file}`,
        origin: "history",
        tags: ["claude", "history"],
        syncedAt: writer.syncedAt,
      });
      const res = writer.write(destRel, note, sha(t.markdown));
      notes.push({ ...res, title: t.title, turns: t.turns, date: t.date });
    }
  }
  return { available: notes.length > 0, notes };
}

// ---------------------------------------------------------------- MOC

const CATEGORY_LABEL = {
  company: "組織データ（.company/）",
  memory: "メモリ（CLAUDE.md）",
  custom: "カスタム定義（skills / agents / commands）",
  history: "会話履歴",
};

function groupByFolder(notes, subfolder, category) {
  // vaultRel は <subfolder>/<category>/<...>/<file>.md 形式。
  // subfolder が入れ子（例: Areas/Claude）でも正しく切り出せるよう深さを計算する。
  const prefixDepth = subfolder.split("/").filter(Boolean).length + 1;
  const groups = new Map();
  for (const n of notes) {
    if (!n || n.binary) continue;
    const parts = n.vaultRel.split("/");
    const dir = parts.slice(prefixDepth, -1).join("/") || category;
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(n);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function writeCategoryMoc(category, result, writer, opts) {
  const notes = result.notes.filter((n) => n && !n.binary);
  if (!notes.length) return null;
  // 索引本文にはタイムスタンプを入れない。中身が変わったときだけ書き換わるようにするため。
  const lines = [
    `# ${CATEGORY_LABEL[category]}`,
    "",
    `> ${notes.length} ノート。同期日時は ${wikilink(
      `${opts.subfolder}/000-Claude-MOC.md`,
      "Claude Vault"
    )} を参照。`,
    "",
  ];
  for (const [dir, items] of groupByFolder(notes, opts.subfolder, category)) {
    lines.push(`## ${dir}`, "");
    for (const n of items.sort((a, b) => a.vaultRel.localeCompare(b.vaultRel))) {
      const label = n.title ?? path.basename(n.vaultRel, ".md");
      lines.push(`- ${wikilink(n.vaultRel, label)}`);
    }
    lines.push("");
  }
  const content = `---\nclaude-origin: moc\ntags: [claude, moc]\n---\n\n${lines.join("\n")}`;
  const res = writer.write(
    path.join(category, `000-${category}-MOC.md`),
    content,
    sha(content),
    true
  );
  return { ...res, count: notes.length };
}

function writeRootMoc(mocs, writer, syncedAt, opts) {
  const lines = [
    "# Claude Vault",
    "",
    "Claude Code に溜まった情報のバックアップです。`export-to-obsidian.mjs` が生成・更新します。",
    "",
    `> 最終同期: ${syncedAt.slice(0, 16).replace("T", " ")} UTC`,
    "",
    "## カテゴリ",
    "",
  ];
  for (const [category, moc] of mocs) {
    if (!moc) continue;
    lines.push(`- ${wikilink(moc.vaultRel, CATEGORY_LABEL[category])} — ${moc.count} ノート`);
  }
  lines.push(
    "",
    "## 同期のしくみ",
    "",
    "- Vault のファイルは**削除されません**（追加・更新のみ）",
    "- Vault 側で手編集したノートは上書きされず、衝突として報告されます",
    "- 再同期: `node export-to-obsidian.mjs --vault <path>`",
    "",
    "## ソース",
    "",
    `- プロジェクト: \`${opts.source}\``,
    `- Claude ホーム: \`${opts.claudeHome}\``,
    `- 対象カテゴリ: ${opts.include.join(", ")}`,
    ""
  );
  const content =
    `---\nclaude-origin: moc\nclaude-synced: ${yamlStr(syncedAt)}\ntags: [claude, moc]\n---\n\n` +
    lines.join("\n");
  return writer.write("000-Claude-MOC.md", content, sha(content), true);
}

// ---------------------------------------------------------------- main

const USAGE = [
  "使い方: node export-to-obsidian.mjs --vault <Obsidian Vault のパス> [options]",
  "",
  "  --vault <path>       (必須) Obsidian Vault のルート",
  "  --source <path>      .company/ を探すプロジェクトルート (default: カレント)",
  "  --subfolder <name>   Vault 内の出力先 (default: Claude)",
  "  --include <list>     company,memory,custom,history から選択",
  "  --history            会話履歴も含める",
  "  --claude-home <path> ~/.claude の場所",
  "  --dry-run            書き込まずに計画だけ表示",
  "  --force              手編集されたノートも上書き",
  "  --json               サマリを JSON 出力",
].join("\n");

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`エラー: ${e.message}`);
    console.error("");
    console.error(USAGE);
    process.exit(2);
  }

  if (opts.help || !opts.vault) {
    console.log(USAGE);
    process.exit(opts.help ? 0 : 2);
  }

  const vaultRoot = path.resolve(opts.vault);
  if (!isDir(vaultRoot)) {
    console.error(`エラー: Vault が見つかりません: ${vaultRoot}`);
    process.exit(2);
  }
  opts.source = path.resolve(opts.source);
  opts.claudeHome = path.resolve(opts.claudeHome);

  const outRoot = path.join(vaultRoot, opts.subfolder);
  const manifestPath = path.join(outRoot, ".sync", "manifest.json");
  const manifest = loadManifest(manifestPath);
  const writer = createWriter(opts, vaultRoot, outRoot, manifest);

  const collectors = {
    company: collectCompany,
    memory: collectMemory,
    custom: collectCustom,
    history: collectHistory,
  };

  const results = {};
  for (const category of CATEGORIES) {
    if (!opts.include.includes(category)) continue;
    try {
      results[category] = collectors[category](opts, writer);
    } catch (e) {
      writer.stats.errors.push(`${category}: ${e.message}`);
      results[category] = { available: false, notes: [] };
    }
  }

  const mocs = [];
  for (const [category, result] of Object.entries(results)) {
    mocs.push([category, writeCategoryMoc(category, result, writer, opts)]);
  }
  writeRootMoc(mocs, writer, writer.syncedAt, opts);

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  const summary = {
    vault: vaultRoot,
    outFolder: opts.subfolder,
    dryRun: opts.dryRun,
    syncedAt: writer.syncedAt,
    categories: Object.fromEntries(
      Object.entries(results).map(([k, v]) => [
        k,
        { available: v.available, notes: v.notes.filter(Boolean).length },
      ])
    ),
    created: writer.stats.written,
    updated: writer.stats.updated,
    unchanged: writer.stats.skipped,
    indexUpdated: writer.stats.index,
    conflicts: writer.stats.conflicts,
    errors: writer.stats.errors,
  };

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    const tag = opts.dryRun ? "[dry-run] " : "";
    console.log(`${tag}Obsidian Vault: ${vaultRoot}`);
    console.log(`${tag}出力先: ${summary.outFolder}/`);
    for (const [k, v] of Object.entries(summary.categories)) {
      console.log(`${tag}  ${CATEGORY_LABEL[k]}: ${v.available ? `${v.notes} 件` : "ソースなし"}`);
    }
    console.log(
      `${tag}新規 ${summary.created} / 更新 ${summary.updated} / 変更なし ${summary.unchanged}` +
        ` / 索引 ${summary.indexUpdated}`
    );
    if (summary.conflicts.length) {
      console.log(`${tag}⚠ 手編集を検出したためスキップ (${summary.conflicts.length} 件):`);
      for (const c of summary.conflicts.slice(0, 20)) console.log(`${tag}    ${c}`);
      if (summary.conflicts.length > 20) {
        console.log(`${tag}    ... 他 ${summary.conflicts.length - 20} 件`);
      }
      console.log(`${tag}  上書きする場合は --force を付けて再実行してください。`);
    }
    for (const e of summary.errors) console.log(`${tag}⚠ ${e}`);
  }
}

main();
