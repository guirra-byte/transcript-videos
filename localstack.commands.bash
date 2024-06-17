$ localstack start
$ aws --endpoint-url=http://localhost:4566 s3 mb s3://danieldcs
# aws - aws-cli command
# --endpoint-url=http://localhost:${Localstack Port} 
# mb - (Make Bucket)
# s3://${Bucket Name}
$ aws --endpoint-url=http://localhost:4566 s3 ls
# ls - List created buckets
$ npm install aws-sdk