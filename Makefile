.PHONY: apk-build aab-build heroku-migrate

HEROKU_APP_NAME ?= honeydew-backend

apk-build:
	cd app && npx eas-cli build --platform android --profile preview --non-interactive

aab-build:
	cd app && npx eas-cli build --platform android --profile production --non-interactive

heroku-migrate:
	@test -n "$(HEROKU_APP_NAME)" || (printf '%s\n' 'Set HEROKU_APP_NAME, for example: make heroku-migrate HEROKU_APP_NAME=my-app' >&2; exit 1)
	heroku run --app "$(HEROKU_APP_NAME)" npx prisma migrate deploy
