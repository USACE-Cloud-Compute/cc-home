# CloudCompute

CloudCompute (CC) is a set of tools and conventions that allow us to organize and orchestrate compute jobs in the cloud, or on your local desktop. CC is built by USACE and optimized to perform hydrologic / hydraulic (H&H) models in massively parallel model runs, however, the tools and conventions are more generally useful and in this documentation we'll keep things simple to start so that we can get to know the basics before trying to apply them to a specific domain.

## Prerequisites

While we try to keep the topics in this documentation as approachable as possible, there are some assumptions being made about the users experience prior to picking up CloudCompute and running with it:

- General Docker knowledge, ideally experience running docker containers, bonus if you have experience building custom images.
- Command-line comfort - CC is primarily a command line utility, you should be comfortable running commands in the terminal.

## Outline

[CloudCompute for Dummies](./01_cc-for-dummies.md) - Introduction to the CloudCompute ecosystem

[Setting up Local Docker](./02_setting-up-local-docker.md) - How to configure a local docker compute environment for CC.

[Setting up AWS](./03_setting-up-aws.md) - How to configure an AWS account for CC.

[Hello World Tutorial](./03a_hello-world.md) - Run the hello world plugin locally to get a feel for how CC orchestrates jobs.
