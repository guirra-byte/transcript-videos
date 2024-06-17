# CREATE AND RUN RABBITMQ AND POSTGRESQL CONTAINER
$ docker run -d --name some-rabbit -p PORT:PORT -p INTERFACE_PORT:INTERFACE_PORT -e RABBITMQ_DEFAULT_USER=user -e RABBITMQ_DEFAULT_PASS=password rabbitmq:3-management
$ docker run -d --name some-pgsql -p PORT:PORT -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password postgres:latest
$ docker run \
  --rm -it \
  -p 127.0.0.1:4566:4566 \
  -p 127.0.0.1:4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack

# SOLVING ERROR: [permission denied while trying to connect to the Docker daemon socket at unix]
$ sudo chmod 666 /var/run/docker.sock

# LOCALSTACK COMMANDS
$ localstack start
$ aws --endpoint-url=http://localhost:4566 s3 mb s3://danieldcs
# aws - aws-cli command
# --endpoint-url=http://localhost:${Localstack Port} 
# mb - (Make Bucket)
# s3://${Bucket Name}
$ aws --endpoint-url=http://localhost:4566 s3 ls
# ls - List created buckets
$ npm install aws-sdk