.PHONY: install auth test run run-no-upload clean

PYTHON ?= python

install:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install torch==2.1.0 --index-url https://download.pytorch.org/whl/cu121
	$(PYTHON) -m pip install -r requirements.txt

auth:
	$(PYTHON) -m scripts.auth_youtube

test:
	$(PYTHON) -m scripts.test_generate

run:
	$(PYTHON) -m src.pipeline --config config.yaml

run-no-upload:
	$(PYTHON) -m src.pipeline --config config.yaml --no-upload

clean:
	rm -rf output/*/ output/cron.log
