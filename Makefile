dev:
	docker compose up app-dev
prod:
	docker compose up -d --build app 
build-dev:
	docker compose up --build app-dev
