# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.12.3](https://github.com/AlexAegis/pakk/compare/v0.12.2...v0.12.3) (2024-10-25)


### Bug Fixes

* **vite-plugin-pakk:** update type ([848943b](https://github.com/AlexAegis/pakk/commit/848943b4ca27a4d5d4024be40b3409e1db1a9f04))

## [0.12.2](https://github.com/AlexAegis/pakk/compare/v0.12.1...v0.12.2) (2024-10-25)

## [0.12.1](https://github.com/AlexAegis/pakk/compare/v0.12.0...v0.12.1) (2024-05-19)

## [0.12.0](https://github.com/AlexAegis/pakk/compare/v0.11.0...v0.12.0) (2024-05-19)


### Features

* **vite-plugin-pakk:** added new option and plugin to preserve import attributes ([9beb34f](https://github.com/AlexAegis/pakk/commit/9beb34f14d601d5629ae3594739f4378b74432f8))
* **vite-plugin-pakk:** treat self imports as external too ([0421cd9](https://github.com/AlexAegis/pakk/commit/0421cd95c4b6c30eb2f1a9acc88be18bb78cbf8c))

## [0.11.0](https://github.com/AlexAegis/pakk/compare/v0.10.0...v0.11.0) (2024-05-19)


### Features

* **core:** automatically add the package.json file to the exports ([2f0a641](https://github.com/AlexAegis/pakk/commit/2f0a64184c14477506f8d68732e35c2d2cd3ce11))

## [0.10.0](https://github.com/AlexAegis/pakk/compare/v0.9.0...v0.10.0) (2024-05-19)


### Features

* **core:** remove workspace specifiers from version in distributed package jsons ([e2398ed](https://github.com/AlexAegis/pakk/commit/e2398edbc5aea6857f3bb38e48d87be07c8c6a05))
* **core:** when removing the workpace version specifier, substitute the version when missing ([e68fcc7](https://github.com/AlexAegis/pakk/commit/e68fcc75dc7e8eef8bbb1987f7df55b7b6e5a23b))

## [0.9.0](https://github.com/AlexAegis/pakk/compare/v0.8.0...v0.9.0) (2024-03-23)

## [0.8.0](https://github.com/AlexAegis/pakk/compare/v0.7.0...v0.8.0) (2023-11-30)

## [0.7.0](https://github.com/AlexAegis/pakk/compare/v0.6.0...v0.7.0) (2023-09-01)

## [0.6.0](https://github.com/AlexAegis/pakk/compare/v0.5.0...v0.6.0) (2023-08-03)

## [0.5.0](https://github.com/AlexAegis/pakk/compare/v0.4.3...v0.5.0) (2023-07-21)


### Features

* added directive support starting with not-distributed ([4b9de84](https://github.com/AlexAegis/pakk/commit/4b9de84a61087a1497be710eb20fc05934edcb7e))

## [0.4.3](https://github.com/AlexAegis/pakk/compare/v0.4.2...v0.4.3) (2023-07-20)


### Features

* **vite-plugin-pakk:** externals function now lets deep imports be externalised too ([b63fe02](https://github.com/AlexAegis/pakk/commit/b63fe02ee249e9990183c31b05bec31faa34e8c0))

## [0.4.2](https://github.com/AlexAegis/pakk/compare/v0.4.1...v0.4.2) (2023-07-18)


### Features

* **cli:** allow format to be selected from the cli ([3ae022d](https://github.com/AlexAegis/pakk/commit/3ae022d01822e30aaac148656ae88f575745a30a))
* **core:** force es only output format in svelte mode ([96118e2](https://github.com/AlexAegis/pakk/commit/96118e2d5918d53b73299d0dc2c6364156c4242a))

## [0.4.1](https://github.com/AlexAegis/pakk/compare/v0.4.0...v0.4.1) (2023-07-18)


### Features

* types of direct svelte exports in the source package should point to dist ([c382cdf](https://github.com/AlexAegis/pakk/commit/c382cdf6d25bbc71074e3f25a92673d5141f8997))

## [0.4.0](https://github.com/AlexAegis/pakk/compare/v0.3.4...v0.4.0) (2023-07-15)


### Features

* svelte support and target package json kind filter ([6b9f86e](https://github.com/AlexAegis/pakk/commit/6b9f86e047ba0c288f74113eb5c88571b24f52e3))

## [0.3.4](https://github.com/AlexAegis/pakk/compare/v0.3.3...v0.3.4) (2023-07-08)


### Features

* **vite-plugin-pakk:** update vite-plugin-dts ([78f2a95](https://github.com/AlexAegis/pakk/commit/78f2a952815ce325357c2583cab283e70a01a670))

## [0.3.3](https://github.com/AlexAegis/pakk/compare/v0.3.2...v0.3.3) (2023-07-08)


### Bug Fixes

* add missing new-line to shim file ([05165a2](https://github.com/AlexAegis/pakk/commit/05165a2cb63d40a53fe9883af063089da92f5c0c))

## [0.3.2](https://github.com/AlexAegis/pakk/compare/v0.3.1...v0.3.2) (2023-07-08)


### Features

* read sort files ([87cc6c2](https://github.com/AlexAegis/pakk/commit/87cc6c207ba1b1adcb1e0337a0340729e20ec613))

## [0.3.1](https://github.com/AlexAegis/pakk/compare/v0.3.0...v0.3.1) (2023-07-06)


### Features

* prettier v3 ([73e7af6](https://github.com/AlexAegis/pakk/commit/73e7af630d43d0793d9af87fbcd76db65aa7f9b2))

## [0.3.0](https://github.com/AlexAegis/pakk/compare/v0.2.4...v0.3.0) (2023-07-06)


### Features

* updated to prettier v3 ([e9f3d88](https://github.com/AlexAegis/pakk/commit/e9f3d882df4c81309195bd84d811aaccfc992589))

## [0.2.4](https://github.com/AlexAegis/pakk/compare/v0.2.3...v0.2.4) (2023-07-04)


### Features

* respect explicit externals fn ([769fc76](https://github.com/AlexAegis/pakk/commit/769fc76540f48e16d2e3b25a97551b425e36038a))
* **vite-plugin-pakk:** respect default build option, default to es2022 ([06751e4](https://github.com/AlexAegis/pakk/commit/06751e4c3950ad1f6207d16a99bf9308dcfed5ca))

## [0.2.3](https://github.com/AlexAegis/pakk/compare/v0.2.2...v0.2.3) (2023-07-01)

## [0.2.2](https://github.com/AlexAegis/pakk/compare/v0.2.1...v0.2.2) (2023-06-26)


### Bug Fixes

* **core:** do not double-strip file extensions ([7fb95ea](https://github.com/AlexAegis/pakk/commit/7fb95ea8a0ad4012199d77d3dc750b1e21f67d21))

## [0.2.1](https://github.com/AlexAegis/pakk/compare/v0.2.0...v0.2.1) (2023-06-26)


### Features

* finish renaming ([e0199fd](https://github.com/AlexAegis/pakk/commit/e0199fdd6dbf1ffa5ea8a4ec80be4c2672c6f87c))
* rename autolib to pakk ([77ab3d9](https://github.com/AlexAegis/pakk/commit/77ab3d98ec0bd889577be781dacc94b169cdbca9))
* rename autolib to pakk phase 1 ([a4ee217](https://github.com/AlexAegis/pakk/commit/a4ee21772ac8e16615ff8ef427210b0bfa5a52eb))
* rename autolib to pakk phase 2 ([259f76c](https://github.com/AlexAegis/pakk/commit/259f76c98426b376c443759bbd4c161526b8b5f6))


### Bug Fixes

* workaround entry merge bug in vite ([496234c](https://github.com/AlexAegis/pakk/commit/496234c083b7075d40e861a47758b652daa76278))

## [0.2.0](https://github.com/AlexAegis/pakk/compare/v0.1.4...v0.2.0) (2023-06-20)


### Features

* **core:** bundle in vite-plugin-dts ([1e561d4](https://github.com/AlexAegis/pakk/commit/1e561d4c00f2c89217605c94e88e5a55da7fa87a))


### Bug Fixes

* added deep export example, fixed dts options ([52fa5df](https://github.com/AlexAegis/pakk/commit/52fa5df2797b136ea08ac90537926a7a100aafb1))
* **cli:** fix some yargs defaults ([50abbee](https://github.com/AlexAegis/pakk/commit/50abbeee4957e9b3dc0177001e713ac9399ddaca))
* **core:** bins are working ([00ea3ea](https://github.com/AlexAegis/pakk/commit/00ea3ea3459faf63ce200f11dc797eed9976c32d))
* **core:** metadata now works ([893ff1d](https://github.com/AlexAegis/pakk/commit/893ff1d58b0ec44d77a5d0d1f3b2b1844b346c35))
* **core:** remove empty dependencies object ([61a3338](https://github.com/AlexAegis/pakk/commit/61a3338a3464e04593a67a3b3280c850d1f88374))
* **core:** static exports ([e4385e4](https://github.com/AlexAegis/pakk/commit/e4385e40d42e5d12d1420eca6c822acffcacf455))
* resolve cyclic build requirements ([ce1c8ba](https://github.com/AlexAegis/pakk/commit/ce1c8ba027377b1a171f9f61add1f1baa531a24e))

## [0.1.4](https://github.com/AlexAegis/pakk/compare/v0.1.3...v0.1.4) (2023-05-29)


### Bug Fixes

* discovering the wrong package ([580eb7c](https://github.com/AlexAegis/pakk/commit/580eb7c0db03ffe20ca7ab417e3312428489c03e))

## [0.1.3](https://github.com/AlexAegis/pakk/compare/v0.1.2...v0.1.3) (2023-05-29)


### Features

* **vite-plugin-pakk:** automatically fill repository.directory ([631909a](https://github.com/AlexAegis/pakk/commit/631909a8904ff55770aefd4840287af5a0a906fa))

## [0.1.2](https://github.com/AlexAegis/pakk/compare/v0.1.1...v0.1.2) (2023-05-23)


### Features

* migrated to autotool ([705307e](https://github.com/AlexAegis/pakk/commit/705307ede884f91f463582743df17dcf6eaef791))

## [0.1.1](https://github.com/AlexAegis/pakk/compare/v0.1.0...v0.1.1) (2023-05-15)


### Bug Fixes

* ignore typedoc output ([e5932aa](https://github.com/AlexAegis/pakk/commit/e5932aa4e9cddad63697b48cd52b998fd6593ffb))

## [0.1.0](https://github.com/AlexAegis/pakk/compare/v0.0.14...v0.1.0) (2023-04-08)


### Features

* updated deps and moved to common configs ([db5e3e5](https://github.com/AlexAegis/pakk/commit/db5e3e5731d1c169a92e2972314b5f8e76d096a3))

### [0.0.14](https://github.com/AlexAegis/pakk/compare/v0.0.13...v0.0.14) (2023-04-03)

### [0.0.13](https://github.com/AlexAegis/pakk/compare/v0.0.12...v0.0.13) (2023-03-11)


### Features

* removed forceMjsExtenstion ([7971d09](https://github.com/AlexAegis/pakk/commit/7971d099a2d0fca0ff87cdf0086d4b31e57179c9))

### [0.0.12](https://github.com/AlexAegis/pakk/compare/v0.0.11...v0.0.12) (2023-03-07)


### Features

* autocopylicense ([5ac1188](https://github.com/AlexAegis/pakk/commit/5ac1188010a6c7011017cc5019c5dba4dd8075e3))

### [0.0.11](https://github.com/AlexAegis/pakk/compare/v0.0.10...v0.0.11) (2023-03-06)


### Bug Fixes

* only run shimming step for development packageJson ([5697637](https://github.com/AlexAegis/pakk/commit/5697637f39ce4efae85096d425a186f314ef607d))

### [0.0.10](https://github.com/AlexAegis/pakk/compare/v0.0.9...v0.0.10) (2023-02-26)


### Bug Fixes

* do not create shim dir if there is no bin to shim ([f58b79e](https://github.com/AlexAegis/pakk/commit/f58b79eed052cff26b183eeb5e648e6e6013401d))

### [0.0.9](https://github.com/AlexAegis/pakk/compare/v0.0.8...v0.0.9) (2023-02-12)


### Bug Fixes

* only use stripped filename as the key for static exports ([5e9ee53](https://github.com/AlexAegis/pakk/commit/5e9ee5381afd4329defc9f7e65ebe23f956e5e3b))

### [0.0.8](https://github.com/AlexAegis/pakk/compare/v0.0.7...v0.0.8) (2023-02-12)


### Features

* added autometadata ([41e3dc9](https://github.com/AlexAegis/pakk/commit/41e3dc996c8116b80f6c64b4f2974f9e806474fb))
* added autoPeer ([0d75675](https://github.com/AlexAegis/pakk/commit/0d75675406ecd0f818ca303158de84f6ee1cc2d9))

### [0.0.7](https://github.com/AlexAegis/pakk/compare/v0.0.6...v0.0.7) (2023-02-04)


### Features

* updated dependencies ([8bf73a4](https://github.com/AlexAegis/pakk/commit/8bf73a4868334bb3182c48e27e896f901ac3c457))

### [0.0.6](https://github.com/AlexAegis/pakk/compare/v0.0.5...v0.0.6) (2023-01-26)


### Features

* automatic export path targeting ([3cbdc8f](https://github.com/AlexAegis/pakk/commit/3cbdc8fa74a334d9c0772f459606d0b0d5397e19))

### [0.0.5](https://github.com/AlexAegis/pakk/compare/v0.0.4...v0.0.5) (2023-01-24)


### Features

* ignore test files when checking entry and bin points ([75fc10f](https://github.com/AlexAegis/pakk/commit/75fc10fcfb3cb3b759b0ee476d29695e9d280b2c))

### [0.0.4](https://github.com/AlexAegis/pakk/compare/v0.0.3...v0.0.4) (2023-01-22)

### 0.0.3 (2022-12-12)


### Features

* add autoreorder ([60aff3f](https://github.com/AlexAegis/pakk/commit/60aff3fb9bd50c9bce0139fd9f177c4eccaea94e))
* add readme.md as a default static export ([48a8a31](https://github.com/AlexAegis/pakk/commit/48a8a3113a094ef0bc2c6268a2842f82bf2c09c7))
* added reorder-object ([a35997e](https://github.com/AlexAegis/pakk/commit/a35997e90f04ed8a421f75ea0726a6140b089275))
* auto-reorder ([55aeb93](https://github.com/AlexAegis/pakk/commit/55aeb93b1cd3af89d589dc22d1125e4d0c84da08))
* autoreorder force types field to be first in exports ([7026ed6](https://github.com/AlexAegis/pakk/commit/7026ed6cd8b0979eeb254f112085f6e48eb1d4be))
* moved plugin to its own repository ([1731a1a](https://github.com/AlexAegis/pakk/commit/1731a1af684ce2c2fb7757483ef6d7885913e34c))

### 0.0.2 (2022-11-13)


### Features

* add readme.md as a default static export ([48a8a31](https://github.com/AlexAegis/pakk/commit/48a8a3113a094ef0bc2c6268a2842f82bf2c09c7))
* moved plugin to its own repository ([1731a1a](https://github.com/AlexAegis/pakk/commit/1731a1af684ce2c2fb7757483ef6d7885913e34c))
