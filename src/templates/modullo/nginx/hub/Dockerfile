# Use base nginx image with stable-alpine
FROM nginx:stable-alpine

WORKDIR /var/www/modullo-hub

# Copy our custom SQL files to /docker-entrypoint-initdb.d folder
COPY ./default.conf.template /etc/nginx/templates/default.conf.template
COPY ./public /var/www/modullo-hub/public


EXPOSE 80