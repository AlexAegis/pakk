# vite-plugin-autolib

[![Latest NPM Version](https://img.shields.io/npm/v/vite-plugin-autolib/latest)](https://www.npmjs.com/package/vite-plugin-autolib)
[![ci](https://github.com/AlexAegis/vite-plugin-autolib/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexAegis/vite-plugin-autolib/actions/workflows/ci.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/6863e4f702e34f4ea54dc05d71acfe7b)](https://www.codacy.com/gh/AlexAegis/vite-plugin-autolib/dashboard?utm_source=github.com&utm_medium=referral&utm_content=AlexAegis/vite-plugin-autolib&utm_campaign=Badge_Grade)
[![codecov](https://codecov.io/github/AlexAegis/vite-plugin-autolib/branch/master/graph/badge.svg?token=OUxofr6zE8)](https://codecov.io/github/AlexAegis/vite-plugin-autolib)

A vite plugin to fill out your `package.json` files for it's local and published
variants

## The problem of setting up an internal build chain

- Local packages are linked as is to eachothers `node_modules` folders
- Local packages depending on local packages are seeing eachothers source
  folder. Not the distribution folder.
- Since they are seeing eachothers source `package.json`, that have to have a
  different `exports` configuration than what the actual distributed
  `package.json` will have
  - Either pointing to the dist folder.
    - The problem with this option is that during development, to see type
      updates, the library has to be rebuilt.
    - Or
  - Or to the source folder

```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
