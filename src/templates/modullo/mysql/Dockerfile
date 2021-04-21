# Use base mysql image with tag 5.7
FROM mysql:5.7

# Copy our custom SQL files to /docker-entrypoint-initdb.d folder
COPY ./core.sql /docker-entrypoint-initdb.d/1_core.sql
COPY ./hub.sql /docker-entrypoint-initdb.d/2_hub.sql