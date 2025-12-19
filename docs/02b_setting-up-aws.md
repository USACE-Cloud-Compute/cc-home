# Setting up an AWS Compute Environment

> This document is under construction

This will guide you through the process of configuring an AWS account for use with Cloud Compute. This assumes that you either have the ability to access and manage services in AWS via the AWS console or CLI.

## S3 Bucket

As with the local Docker compute environment, we need an object store for CC to use. Create a bucket with a top-level prefix of `cc_store` in S3.

## AWS Batch

The [structure of AWS Batch](https://docs.aws.amazon.com/batch/latest/userguide/batch_components.html) is closely tied with how CC computes are structured. To get ready to run computes in AWS, you will need to set up the compute environment and establish a queue that can be used to deploy compute runs.

## IAM Policy

In order for the CLI to run computes in AWS you will need to establish an IAM policy that allows use of the Batch service and the S3 bucket created earlier. How you will establish a session and the associated keys will depend on the authorization rules for the AWS account you are using. The most straight forward set up is to issue a set of static keys that can be used by the CLI.
