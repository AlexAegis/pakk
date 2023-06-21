# [pakk](https://github.com/AlexAegis/autolib/tree/master/packages/cli/)

[![Latest NPM Version](https://img.shields.io/npm/v/pakk/latest)](https://www.npmjs.com/package/pakk)
[![ci](https://github.com/AlexAegis/autolib/actions/workflows/cicd.yml/badge.svg)](https://github.com/AlexAegis/autolib/actions/workflows/cicd.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/6863e4f702e34f4ea54dc05d71acfe7b)](https://www.codacy.com/gh/AlexAegis/autolib/dashboard?utm_source=github.com&utm_medium=referral&utm_content=AlexAegis/autolib&utm_campaign=Badge_Grade)
[![codecov](https://codecov.io/github/AlexAegis/autolib/branch/master/graph/badge.svg?token=OUxofr6zE8)](https://codecov.io/github/AlexAegis/autolib)

This packages exposes autolib to be used on it's own, preferrably after another
tool built your library. At this point this cli will adjust both your `source`
and `dist` packageJson files.

> By using autolib like this you are expected to ensure your build tool emits
> the output the same way autolib generates the package.json.

If you're using [`vite`](https://vitejs.dev/) as your build tool I recommend
using the vite plugin form of this tool: [`vite-plugin-pakk`](../vite-plugin/)
