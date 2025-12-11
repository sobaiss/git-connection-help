## Seloger tchad

## Sync images

aws s3 cp --recursive s3://beti-infra-dev-public-bucket/ beti-infra-dev-public-bucket --profile seloger-tchad-prod
aws s3 sync beti-infra-dev-public-bucket s3://slt-infra-dev-public-bucket --cache-control 'max-age=31536000, public' --metadata-directive REPLACE
