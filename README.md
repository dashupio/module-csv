Dashup Module Application
&middot;
[![Latest Github release](https://img.shields.io/github/release/dashup/module-csv.svg)](https://github.com/dashup/module-csv/releases/latest)
=====

A connect interface for csv on [dashup](https://dashup.io).

## Contents
* [Get Started](#get-started)
* [Connect interface](#connect)

## Get Started

This csv connector adds csvs functionality to Dashup csvs:

```json
{
  "url" : "https://dashup.io",
  "key" : "[dashup module key here]"
}
```

To start the connection to dashup:

`npm run start`

## Deployment

1. `docker build -t dashup/module-csv .`
2. `docker run -d -v /path/to/.dashup.json:/usr/src/module/.dashup.json dashup/module-csv`