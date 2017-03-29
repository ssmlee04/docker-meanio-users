#!/bin/bash
aws ecr get-login --region us-east-1 | sh
GIT_COMMIT=$(git rev-parse HEAD)

# check docker version
docker --version

# build 
docker build --rm=false -t ssmlee04/docker-backend-users .

# tag
docker tag ssmlee04/docker-backend-users:latest 264208240070.dkr.ecr.us-east-1.amazonaws.com/ssmlee04/docker-backend-users:latest
docker tag ssmlee04/docker-backend-users:latest 264208240070.dkr.ecr.us-east-1.amazonaws.com/ssmlee04/docker-backend-users:$GIT_COMMIT

# push
docker push 264208240070.dkr.ecr.us-east-1.amazonaws.com/ssmlee04/docker-backend-users:latest
docker push 264208240070.dkr.ecr.us-east-1.amazonaws.com/ssmlee04/docker-backend-users:$GIT_COMMIT
