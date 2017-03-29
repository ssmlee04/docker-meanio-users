#!/bin/bash
name=$1

if [ "$name" = "" ]; then
  echo 'please enter a branch name'
  exit 1
elif [ "$name" = "development" ]; then
  echo 'cannot be development'
  exit 1
elif [ "$name" = "stage" ]; then
  echo 'cannot be stage'
  exit 1
elif [ "$name" = "master" ]; then
  echo 'cannot be master'
  exit 1
else 
  git branch -D $name
  git push origin --delete $name
fi