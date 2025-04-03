dev:
	docker compose up app-dev
prod:
	git pull 
	docker compose up -d --build app 
build-dev:
	docker compose up --build app-dev
