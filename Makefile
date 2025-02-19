
APP_NAME = node-hello-world


DEV_IMAGE = $(APP_NAME)-dev
PROD_IMAGE = $(APP_NAME)-prod


ifeq ($(OS),Windows_NT)
	CURRENT_DIR := $(shell cd)
else
	CURRENT_DIR := $(shell pwd)
endif


build:
	docker build -t $(APP_NAME) .


dev:
	docker build --target dev -t $(DEV_IMAGE) .


prod:
	docker build --target prod -t $(PROD_IMAGE) .



run-dev:						
	docker run  -v "$(CURRENT_DIR):/app" -p 3000:3000 -p 9229:9229 --name $(DEV_IMAGE) $(DEV_IMAGE)


run-prod:
	docker run --rm -d -p 3000:3000 --name $(PROD_IMAGE) $(PROD_IMAGE)


stop-dev:
	docker stop $(DEV_IMAGE)


stop-prod:
	docker stop $(PROD_IMAGE)


rm-dev:
	docker rm $(DEV_IMAGE)


rm-prod:
	docker rm $(PROD_IMAGE)


clean:
	docker image prune -f



start-dev:
	docker start ${DEV_IMAGE}