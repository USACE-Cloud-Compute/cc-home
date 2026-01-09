# CC FFRD Trinity Tutorial

Now that you have the [`cccli` up and running](./03_cc-cli.md) locally and a [local Docker compute environment](./02_setting-up-local-docker.md) configured we set up the rest of the FFRD trinity data.

## Setup

The following steps assume that you have cloned this repository to your local machine and are working in the command line in the `tutorials/tutorials/FFRD/trinity/local` directory

We also assume that you've created an environment file at `.env`, meaning, if you haven't already, create a file inside the working directory called `.env`; populate it like this:

```
CC_AWS_ACCESS_KEY_ID=insert-user-name
CC_AWS_SECRET_ACCESS_KEY=insert-password
CC_AWS_DEFAULT_REGION=us-east-1
CC_AWS_S3_BUCKET=ccstore
CC_AWS_ENDPOINT=http://localhost:9000
```

> Make sure to update your access keys to the ones created when configuring the local `ccstore` in minio.

## Data Package.
Download the conformance data for the trinity project from this [base data package](https://github.com/USACE-Cloud-Compute/cc-home/releases/download/1.0.1/conformance.7z) and extract it to `tutorials/tutorials/FFRD/trinity/data/ffrd-trinity/`. You can further download the [terrain package](https://github.com/USACE-Cloud-Compute/cc-home/releases/download/1.0.1/terrain-mapping.7z) for the steps involving generating gridded outputs from RAS 2025.

Once the data is downloaded and extracted, it needs to be loaded into the "project-data" bucket on minio.

## Running Computes.
To start the first step change directory into `/tutorials/FFRD/trinity/local/1-blockfile-generation/`. The README.md has useful information on the compute-manifest.json in that directory and describes how to compute the job using cccli. 

The Compute can be started using the command:

```sh
..\..\cccli --envFile=.env run
```

This should result in a file called blocks.json being stored in minio at `/ffrd-trinity/conformance/simulations/blockfile.json`

To advance to the next step, change directory `..\2-seed-generation` and then run the compute using the command. 

```sh
..\..\cccli --envFile=.env run
```

This can be continued through the steps in the directories in order. We advise taking the time and reading each README.md to understand what actions are being performed, what to expect, and what the parameters and inputs and outputs mean.

Enjoy the rest of the tutorial!
