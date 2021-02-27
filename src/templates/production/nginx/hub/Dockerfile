# Use base nginx image with stable-alpine
FROM nginx:stable-alpine

WORKDIR /var/www/dorcas-business-hub

# Copy our custom SQL files to /docker-entrypoint-initdb.d folder
COPY ./default.conf.template /etc/nginx/templates/default.conf.template
COPY ./public /var/www/dorcas-business-hub/public


EXPOSE 80