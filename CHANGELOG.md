# Changelog

## [1.1.0](https://github.com/djm204/agent-skills/compare/agent-skills-v1.0.0...agent-skills-v1.1.0) (2026-02-19)


### Features

* adapter system for framework-agnostic skill output ([#96](https://github.com/djm204/agent-skills/issues/96)) ([0664f58](https://github.com/djm204/agent-skills/commit/0664f58de846fa9d8f49688256a8f8f174684791)), closes [#91](https://github.com/djm204/agent-skills/issues/91)
* add CLI entry point ([3d2a0e4](https://github.com/djm204/agent-skills/commit/3d2a0e40bd40d652880efd90d3476b90503a73d4))
* add dogfood script to self-install templates via bin/cli.js ([#90](https://github.com/djm204/agent-skills/issues/90)) ([cbc840b](https://github.com/djm204/agent-skills/commit/cbc840bec4be16b0c1e801a83ed8f1e58ab6051a))
* add root cursorrules ([a115ac5](https://github.com/djm204/agent-skills/commit/a115ac5e40b81b2276fca428eca95bb72175aa07))
* add shared template foundations ([5bd0bc9](https://github.com/djm204/agent-skills/commit/5bd0bc9420814a6363af5073304e48823989c98c))
* add skill-loader for universal skill.yaml format ([#94](https://github.com/djm204/agent-skills/issues/94)) ([5cecc38](https://github.com/djm204/agent-skills/commit/5cecc380d41c180dbec7caaea89b09a06ad55817)), closes [#91](https://github.com/djm204/agent-skills/issues/91)
* **cli:** add --ide parameter for selective installation ([f16cb57](https://github.com/djm204/agent-skills/commit/f16cb57450d351cb096d77d1bad3b7ecb196943c))
* **cli:** add --ide parameter for selective installation ([15a2a7c](https://github.com/djm204/agent-skills/commit/15a2a7c3444c1e14c00e5fbccbb4da6db0f807f3))
* **cli:** add --ide parameter for selective installation ([f83a170](https://github.com/djm204/agent-skills/commit/f83a17038f4a70e1a52926e95510aa22fadfa46e))
* **cli:** add --remove and --reset commands for template removal ([#12](https://github.com/djm204/agent-skills/issues/12)) ([4293ebc](https://github.com/djm204/agent-skills/commit/4293ebc23bea4b408d91d3b60926339d518fedc0))
* **cli:** add changelog link to version output ([#17](https://github.com/djm204/agent-skills/issues/17)) ([d3945ff](https://github.com/djm204/agent-skills/commit/d3945ff713c4c67e7f98bf042cff3f268689d966))
* **cli:** add logical shorthand aliases for templates ([#84](https://github.com/djm204/agent-skills/issues/84)) ([9e6cbbf](https://github.com/djm204/agent-skills/commit/9e6cbbf214e8d8f4d8c46230d76af46534a344e4))
* **cli:** add shorthand aliases for language expert templates ([#53](https://github.com/djm204/agent-skills/issues/53)) ([824ee0d](https://github.com/djm204/agent-skills/commit/824ee0dd1bf700e2d251c3c82808238df8df4c39))
* **cli:** add version checking and troubleshooting docs ([8c590a0](https://github.com/djm204/agent-skills/commit/8c590a0bc9ba93857cbf0a20a856e427b6cd60c6))
* **cli:** intelligently merge claude.md sections instead of overwriting ([7ca293c](https://github.com/djm204/agent-skills/commit/7ca293cd1f3a8c5cae1833b7de6ad6c6a9ac9a1b))
* **cli:** migrate Cursor rules from .cursorrules/ to .cursor/rules/ ([#59](https://github.com/djm204/agent-skills/issues/59)) ([5518171](https://github.com/djm204/agent-skills/commit/551817101dbb1c8362d5e7f229939f0790f93dc8))
* **cli:** preserve existing files during installation ([4d90aeb](https://github.com/djm204/agent-skills/commit/4d90aebee36208b5d583b1ed738d5b4fc771a926))
* initial skill packs with tiered prompts (5 skills) ([#95](https://github.com/djm204/agent-skills/issues/95)) ([ee56c8f](https://github.com/djm204/agent-skills/commit/ee56c8f15a5d49fece0ab9c4816208f67309f111)), closes [#91](https://github.com/djm204/agent-skills/issues/91)
* **languages:** add Ruby expert template ([#83](https://github.com/djm204/agent-skills/issues/83)) ([31672ee](https://github.com/djm204/agent-skills/commit/31672eec1f341c378fe95953a34cd1a78dedb6b7))
* **languages:** add ruby-expert template ([#75](https://github.com/djm204/agent-skills/issues/75)) ([b8aca6e](https://github.com/djm204/agent-skills/commit/b8aca6e9340e7734f5c359d2bc2faea57663c859))
* programmatic public API — loadSkill, listSkills, getAdapter ([#97](https://github.com/djm204/agent-skills/issues/97)) ([27a0f9f](https://github.com/djm204/agent-skills/commit/27a0f9fa2d157b4be8f47177f049d6587dd8e588)), closes [#91](https://github.com/djm204/agent-skills/issues/91)
* **templates:** add 16 new agentic archetype templates ([#69](https://github.com/djm204/agent-skills/issues/69)) ([6587ce2](https://github.com/djm204/agent-skills/commit/6587ce2d6ec2afcc3b9a7fb19e13e60c0c8f608c))
* **templates:** add blockchain template ([327f705](https://github.com/djm204/agent-skills/commit/327f7059150575cc23389f9ea192ec4cdf39589f))
* **templates:** add cli-tools template ([f279722](https://github.com/djm204/agent-skills/commit/f279722d410ddf1e85ad49fb15ff6923c80b964f))
* **templates:** add comprehensive testing template ([#11](https://github.com/djm204/agent-skills/issues/11)) ([cc0ece6](https://github.com/djm204/agent-skills/commit/cc0ece672782d215f2d5b341225d3f42f30679e6))
* **templates:** add cpp-expert template ([#48](https://github.com/djm204/agent-skills/issues/48)) ([e2e29a5](https://github.com/djm204/agent-skills/commit/e2e29a571a428da27bd25f3d685438ccf50aa1f8))
* **templates:** add csharp-expert template ([#46](https://github.com/djm204/agent-skills/issues/46)) ([f930bad](https://github.com/djm204/agent-skills/commit/f930badc2c2621f10b4250af02d4540d4e20f53f))
* **templates:** add data-engineering template ([0ba3377](https://github.com/djm204/agent-skills/commit/0ba33771d0e3b5297fce41649d8cea83d3282e60))
* **templates:** add devops-sre template ([f9b102b](https://github.com/djm204/agent-skills/commit/f9b102b7859a9fd914ccca3c3093a494586b487f))
* **templates:** add documentation template ([41deb1f](https://github.com/djm204/agent-skills/commit/41deb1ff1d8a444d26cad932210449109f9d5810))
* **templates:** add educator template ([#54](https://github.com/djm204/agent-skills/issues/54)) ([f1f2f1f](https://github.com/djm204/agent-skills/commit/f1f2f1f099426e0f7f5acab4c43213d06809e0b1))
* **templates:** add fullstack template ([8486e29](https://github.com/djm204/agent-skills/commit/8486e29597af0e0dc0a9355198b95e744dd886e1))
* **templates:** add golang-expert template ([#34](https://github.com/djm204/agent-skills/issues/34)) ([5f46bb8](https://github.com/djm204/agent-skills/commit/5f46bb8cecfda3fab25e011c89115c1d1b726970))
* **templates:** add java-expert template ([#47](https://github.com/djm204/agent-skills/issues/47)) ([b8b1de4](https://github.com/djm204/agent-skills/commit/b8b1de4bc582d436c435ffd1b0ea3c4045568b9a))
* **templates:** add javascript-expert template and register missing templates ([#33](https://github.com/djm204/agent-skills/issues/33)) ([fce118d](https://github.com/djm204/agent-skills/commit/fce118d9ee39731f91fa6b92065b65764bee26ed))
* **templates:** add kotlin-expert template ([#50](https://github.com/djm204/agent-skills/issues/50)) ([15a14ca](https://github.com/djm204/agent-skills/commit/15a14ca2fde429316121809a93543b39d96999ad))
* **templates:** add ml-ai template ([4ac8710](https://github.com/djm204/agent-skills/commit/4ac87106e3ab4929c43ddb85cb84a6cfc2f948cc))
* **templates:** add mobile template ([21c2f6e](https://github.com/djm204/agent-skills/commit/21c2f6ed22393caa6ba94fb112af1f3f1db7f6d4))
* **templates:** add platform-engineering template ([9c12b12](https://github.com/djm204/agent-skills/commit/9c12b12cf41443fb448016a273bbf6a3dee760af))
* **templates:** add product-manager and qa-engineering templates ([#26](https://github.com/djm204/agent-skills/issues/26)) ([9980299](https://github.com/djm204/agent-skills/commit/99802991f0e7bd6baa857fe11b2f64847dedb60b))
* **templates:** add project-manager, supply-chain, executive-assistant, grant-writer templates ([#66](https://github.com/djm204/agent-skills/issues/66)) ([aae6243](https://github.com/djm204/agent-skills/commit/aae62431c5f677adce3ba0d009f9ced89ba0728f))
* **templates:** add python-expert template ([#41](https://github.com/djm204/agent-skills/issues/41)) ([49fa65f](https://github.com/djm204/agent-skills/commit/49fa65f59fde3a886ba3820ff31debf1bcde6a27))
* **templates:** add research-assistant template ([#82](https://github.com/djm204/agent-skills/issues/82)) ([c8e5440](https://github.com/djm204/agent-skills/commit/c8e544075444e7d121cfa247f2a581da7a65121f))
* **templates:** add rust-expert template ([#35](https://github.com/djm204/agent-skills/issues/35)) ([8bc4786](https://github.com/djm204/agent-skills/commit/8bc47863b43f472153960ad3dd5f08e9adc7b67e))
* **templates:** add swift-expert template ([#52](https://github.com/djm204/agent-skills/issues/52)) ([69fa9b8](https://github.com/djm204/agent-skills/commit/69fa9b83e91208e7ccad6c3f1b7908ba2a74a40d))
* **templates:** add utility-agent template ([51a219a](https://github.com/djm204/agent-skills/commit/51a219a195bf3d64241603fcf3a49b8cbe03afdd))
* **templates:** add ux-designer template ([#57](https://github.com/djm204/agent-skills/issues/57)) ([bf9489f](https://github.com/djm204/agent-skills/commit/bf9489f97215328e91065c4f6649f95af79beaa0))
* **templates:** add web-backend template ([2b60450](https://github.com/djm204/agent-skills/commit/2b604504a5b56ae34871f7d01a2b288d2a075c70))
* **templates:** add web-frontend template ([92ca080](https://github.com/djm204/agent-skills/commit/92ca080a4da02d14813339c7b92cf88ffe81a679))
* **templates:** extend javascript-expert with TypeScript deep dive ([#49](https://github.com/djm204/agent-skills/issues/49)) ([0edcde8](https://github.com/djm204/agent-skills/commit/0edcde863a44a2ae8bc0b07d60105044fc137b03))
* **templates:** organize templates into category subdirectories ([#62](https://github.com/djm204/agent-skills/issues/62)) ([7d7389c](https://github.com/djm204/agent-skills/commit/7d7389c6204c72377080e2a660d8c8513f0ba103))
* token optimization — slim CLAUDE.md and on-demand docs ([#88](https://github.com/djm204/agent-skills/issues/88)) ([6ed3f64](https://github.com/djm204/agent-skills/commit/6ed3f64d10d6961934f44338a28fcca1205ece0d))


### Bug Fixes

* **ci:** configure release-please for proper semver ([c083807](https://github.com/djm204/agent-skills/commit/c083807ae2b2a0c561a2399dbe73cdad4154388e))
* **ci:** enable auto-merge directly in release-please workflow ([#28](https://github.com/djm204/agent-skills/issues/28)) ([64e1c5d](https://github.com/djm204/agent-skills/commit/64e1c5d79a57720cd8042bca5bf5ca3263f3450e))
* **ci:** quote if expression to fix YAML parsing error ([#24](https://github.com/djm204/agent-skills/issues/24)) ([5038e63](https://github.com/djm204/agent-skills/commit/5038e63707d7fc9bf67c7d9666d3b5fafd198b58))
* combine claude.md when almost the same ([0d98141](https://github.com/djm204/agent-skills/commit/0d98141957770043b46444a708c7e2781533c22c))
* **cursor:** copy legacy .cursorrules/ files to .cursor/rules/ before removing directory ([#61](https://github.com/djm204/agent-skills/issues/61)) ([b78f12c](https://github.com/djm204/agent-skills/commit/b78f12c2145aaaf1633c6bb61882da6770f15e67))
* **docs:** add blank lines and language specs to README code blocks ([#22](https://github.com/djm204/agent-skills/issues/22)) ([164a003](https://github.com/djm204/agent-skills/commit/164a003bc0cef7fc461bace9861430dc34837cee))
* **docs:** replace angle brackets with square brackets in README ([#20](https://github.com/djm204/agent-skills/issues/20)) ([922fc97](https://github.com/djm204/agent-skills/commit/922fc973cb9da44bb60068578f0f08313c054df2))
* update repository URLs to match actual repo name ([96a3235](https://github.com/djm204/agent-skills/commit/96a323518152b9fb8f178a26892f58c75b33b6d8))


### Miscellaneous

* add .gitignore ([16fb92d](https://github.com/djm204/agent-skills/commit/16fb92d8d0aa95e6d44b7305399d155a85f4c61e))
* add project configuration ([fbb83da](https://github.com/djm204/agent-skills/commit/fbb83da80e40de53cd2d66a73411bbabc3ff3907))
* **docs:** add documentation agentic-team-templates ([#31](https://github.com/djm204/agent-skills/issues/31)) ([a347d7f](https://github.com/djm204/agent-skills/commit/a347d7f83bc445ec65078e23556dc4e08ba61f4d))
* **docs:** document .mdc format, front matter, and short focused rules ([#77](https://github.com/djm204/agent-skills/issues/77)) ([1d5748e](https://github.com/djm204/agent-skills/commit/1d5748ecdbba7e0fa4a5023332a702904d5fb4fa))
* **docs:** update readme ([#73](https://github.com/djm204/agent-skills/issues/73)) ([7ac83ae](https://github.com/djm204/agent-skills/commit/7ac83ae8b7dad47744d95f5e558e2ab4e3c547b1))
* **lint:** allow any case in commit subjects ([c4d7388](https://github.com/djm204/agent-skills/commit/c4d73887021946db2e3e67953e1fdfc3baebd83c))
* **main:** release agentic-team-templates 0.10.0 ([#36](https://github.com/djm204/agent-skills/issues/36)) ([7dd9fed](https://github.com/djm204/agent-skills/commit/7dd9fed3dabc0fad9eaa1d86bd200a851881a9a1))
* **main:** release agentic-team-templates 0.11.0 ([#37](https://github.com/djm204/agent-skills/issues/37)) ([9233eee](https://github.com/djm204/agent-skills/commit/9233eeed89f6bf6523e67083888b3318803d2a27))
* **main:** release agentic-team-templates 0.12.0 ([#38](https://github.com/djm204/agent-skills/issues/38)) ([e5ca979](https://github.com/djm204/agent-skills/commit/e5ca97945026f33a8dda2c6a97ee9eb7f2d79a5f))
* **main:** release agentic-team-templates 0.12.1 ([#40](https://github.com/djm204/agent-skills/issues/40)) ([5c951ab](https://github.com/djm204/agent-skills/commit/5c951abbc897fa20700a35359459afd0b86e926d))
* **main:** release agentic-team-templates 0.13.0 ([#42](https://github.com/djm204/agent-skills/issues/42)) ([ac12a2a](https://github.com/djm204/agent-skills/commit/ac12a2ad857eb64de04c280650dd9830e315e431))
* **main:** release agentic-team-templates 0.13.1 ([#43](https://github.com/djm204/agent-skills/issues/43)) ([ba32685](https://github.com/djm204/agent-skills/commit/ba326857dec4945639a1745286dcecd8ac6592dd))
* **main:** release agentic-team-templates 0.13.2 ([#45](https://github.com/djm204/agent-skills/issues/45)) ([a8eb860](https://github.com/djm204/agent-skills/commit/a8eb860de6dbd6c62d7ee278f0ad7be9ba390490))
* **main:** release agentic-team-templates 0.14.0 ([#51](https://github.com/djm204/agent-skills/issues/51)) ([049471f](https://github.com/djm204/agent-skills/commit/049471f9b74c10554dc9e3a63d2c8bed139237c6))
* **main:** release agentic-team-templates 0.15.0 ([#55](https://github.com/djm204/agent-skills/issues/55)) ([a60d8f9](https://github.com/djm204/agent-skills/commit/a60d8f9c6ce6c62aa9de8a485fe3a8e934ba7aeb))
* **main:** release agentic-team-templates 0.16.0 ([#56](https://github.com/djm204/agent-skills/issues/56)) ([20472e7](https://github.com/djm204/agent-skills/commit/20472e798ffa27f71f79bca3dc6aabfe7a0bca00))
* **main:** release agentic-team-templates 0.17.0 ([#58](https://github.com/djm204/agent-skills/issues/58)) ([9f35d4d](https://github.com/djm204/agent-skills/commit/9f35d4dc0abe80f9ac376868824dc79b00348bcb))
* **main:** release agentic-team-templates 0.18.0 ([#60](https://github.com/djm204/agent-skills/issues/60)) ([1cf35a1](https://github.com/djm204/agent-skills/commit/1cf35a16c585e640ce18d3c249f8e8299cd29f6f))
* **main:** release agentic-team-templates 0.19.0 ([#63](https://github.com/djm204/agent-skills/issues/63)) ([997e060](https://github.com/djm204/agent-skills/commit/997e06088d4c0f7ac41312d89982a7dcd4bc47ab))
* **main:** release agentic-team-templates 0.19.1 ([#65](https://github.com/djm204/agent-skills/issues/65)) ([5dfc5b4](https://github.com/djm204/agent-skills/commit/5dfc5b4fed721c5807ee99dd90fb67bfe3a35681))
* **main:** release agentic-team-templates 0.20.0 ([#67](https://github.com/djm204/agent-skills/issues/67)) ([e01c77b](https://github.com/djm204/agent-skills/commit/e01c77b1ee060dd82437aec1757871d251e0ce84))
* **main:** release agentic-team-templates 0.21.0 ([#70](https://github.com/djm204/agent-skills/issues/70)) ([b23cb1c](https://github.com/djm204/agent-skills/commit/b23cb1cce76dda7a6219f1b86f14b97cdfd6f023))
* **main:** release agentic-team-templates 0.21.1 ([#74](https://github.com/djm204/agent-skills/issues/74)) ([b041aa6](https://github.com/djm204/agent-skills/commit/b041aa6f8b1390901eba1c5a3650825ad463c8ba))
* **main:** release agentic-team-templates 0.22.0 ([#76](https://github.com/djm204/agent-skills/issues/76)) ([556a6d0](https://github.com/djm204/agent-skills/commit/556a6d0d9ea31d4080c8637e4573c4f14c668f3c))
* **main:** release agentic-team-templates 0.22.1 ([#78](https://github.com/djm204/agent-skills/issues/78)) ([c893709](https://github.com/djm204/agent-skills/commit/c893709c3284a874f594843e6974dcd731c96d0a))
* **main:** release agentic-team-templates 0.22.2 ([#81](https://github.com/djm204/agent-skills/issues/81)) ([2587f9d](https://github.com/djm204/agent-skills/commit/2587f9d44f79fa7c18551304a87ed16c01801a7c))
* **main:** release agentic-team-templates 0.23.0 ([#85](https://github.com/djm204/agent-skills/issues/85)) ([cd02e9d](https://github.com/djm204/agent-skills/commit/cd02e9d86334024a2e03372957e1bba04ff0fbae))
* **main:** release agentic-team-templates 0.23.1 ([#87](https://github.com/djm204/agent-skills/issues/87)) ([cab60d1](https://github.com/djm204/agent-skills/commit/cab60d1ff5f274fec64d9be785e8157db9a0e389))
* **main:** release agentic-team-templates 0.24.0 ([#89](https://github.com/djm204/agent-skills/issues/89)) ([7ce5063](https://github.com/djm204/agent-skills/commit/7ce506365fbfe60d3305dd33d1f58a6d8f3bac88))
* **main:** release agentic-team-templates 0.3.0 ([8ea2ccc](https://github.com/djm204/agent-skills/commit/8ea2ccc5f1f01bbb1efbaa6b26aa9f0eb3fae9e6))
* **main:** release agentic-team-templates 0.3.0 ([cfcb1b9](https://github.com/djm204/agent-skills/commit/cfcb1b94c57faca773cf491fbae672ea485a044b))
* **main:** release agentic-team-templates 0.4.0 ([199bd81](https://github.com/djm204/agent-skills/commit/199bd8162c4b7bab5ccc73f6bc301459f5bfb7ce))
* **main:** release agentic-team-templates 0.4.0 ([2d46144](https://github.com/djm204/agent-skills/commit/2d46144aa8bb4e66e306cebcb10873f57ed6f1f6))
* **main:** release agentic-team-templates 0.4.1 ([23a222c](https://github.com/djm204/agent-skills/commit/23a222c0485f42a055e5da21ad47cf133414ba4f))
* **main:** release agentic-team-templates 0.4.1 ([0f25640](https://github.com/djm204/agent-skills/commit/0f25640e9951664cdb8cf07810a09c2f45b53199))
* **main:** release agentic-team-templates 0.4.2 ([d975080](https://github.com/djm204/agent-skills/commit/d975080eb64a974bea48c4fa6fafccfa9fd6120d))
* **main:** release agentic-team-templates 0.4.2 ([5477def](https://github.com/djm204/agent-skills/commit/5477deff3d98a9fbecd6b52ccd66f484c877bd33))
* **main:** release agentic-team-templates 0.5.0 ([538036b](https://github.com/djm204/agent-skills/commit/538036b082d344dddcb7e78f83154d137672f9bc))
* **main:** release agentic-team-templates 0.5.0 ([a7eb33e](https://github.com/djm204/agent-skills/commit/a7eb33efd27b216c0f957a585aa6bbd15b2a8ed8))
* **main:** release agentic-team-templates 0.6.0 ([#13](https://github.com/djm204/agent-skills/issues/13)) ([acab957](https://github.com/djm204/agent-skills/commit/acab95796f346600aa3e9c0b22f36005ca68430b))
* **main:** release agentic-team-templates 0.6.1 ([#15](https://github.com/djm204/agent-skills/issues/15)) ([ba5dff4](https://github.com/djm204/agent-skills/commit/ba5dff4399b3b68969335ae217eb44de215605b9))
* **main:** release agentic-team-templates 0.7.0 ([#16](https://github.com/djm204/agent-skills/issues/16)) ([c7dde9b](https://github.com/djm204/agent-skills/commit/c7dde9bab8546bc4673a1f4c2d76af7b416839c6))
* **main:** release agentic-team-templates 0.8.0 ([#18](https://github.com/djm204/agent-skills/issues/18)) ([c2551c6](https://github.com/djm204/agent-skills/commit/c2551c682d759fb1cc78d8d07a50a6c44f0f0643))
* **main:** release agentic-team-templates 0.8.1 ([#21](https://github.com/djm204/agent-skills/issues/21)) ([8283033](https://github.com/djm204/agent-skills/commit/82830336e31ac42b8606daa6198903b09f858701))
* **main:** release agentic-team-templates 0.8.2 ([#23](https://github.com/djm204/agent-skills/issues/23)) ([00047c9](https://github.com/djm204/agent-skills/commit/00047c9a55d846b143ddd7f18c7392acdfe6ef6c))
* **main:** release agentic-team-templates 0.8.3 ([#25](https://github.com/djm204/agent-skills/issues/25)) ([25ae247](https://github.com/djm204/agent-skills/commit/25ae2471390b187544b9f4003e256e0d1bb9b9bb))
* **main:** release agentic-team-templates 0.9.0 ([#27](https://github.com/djm204/agent-skills/issues/27)) ([ea52d4a](https://github.com/djm204/agent-skills/commit/ea52d4aa6f0b98b1581f469092f5178a5968fa11))
* **main:** release agentic-team-templates 0.9.1 ([#29](https://github.com/djm204/agent-skills/issues/29)) ([f88d915](https://github.com/djm204/agent-skills/commit/f88d91518edade3dec172e2c061e315b593b80ef))
* **main:** release agentic-team-templates 0.9.2 ([#32](https://github.com/djm204/agent-skills/issues/32)) ([96ac487](https://github.com/djm204/agent-skills/commit/96ac487dbf37aa28fbea1597260acb7d623f686b))
* **main:** release cursor-templates 0.2.0 ([fbac466](https://github.com/djm204/agent-skills/commit/fbac4669823f0dc5f687f1f265d0411f2221668a))
* **main:** release cursor-templates 0.2.0 ([ffda617](https://github.com/djm204/agent-skills/commit/ffda61744ad4ae48a433851a5974a7a6d897f98f))
* remove unnecessary test step from release workflow ([3a3e1f2](https://github.com/djm204/agent-skills/commit/3a3e1f257d2d3e2d70f18c94bb12308117b9d677))
* rename to @djm204/agent-skills v1.0.0 ([#92](https://github.com/djm204/agent-skills/issues/92)) ([a91258d](https://github.com/djm204/agent-skills/commit/a91258dd84ebcec2914ba09148e26d220c937f05))
* **rules:** add rules-creation-best-practices.mdc ([#79](https://github.com/djm204/agent-skills/issues/79)) ([86f009a](https://github.com/djm204/agent-skills/commit/86f009aa453260d613f1b805750f8b598787ebdb))
* **templates:** condense oversized .mdc files to under 500 lines ([#80](https://github.com/djm204/agent-skills/issues/80)) ([6f76133](https://github.com/djm204/agent-skills/commit/6f76133cc3c2c6132715182e0b0a96fd47a5e6b5))
* update author email and github username ([9190dbd](https://github.com/djm204/agent-skills/commit/9190dbd84cc59d45a91078cca2186f12775bffeb))
* update CLAUDE.md and release-please.yml ([#64](https://github.com/djm204/agent-skills/issues/64)) ([48a488e](https://github.com/djm204/agent-skills/commit/48a488e2812672a4c36a4e7744eef9c4da16e285))
* update installer name ([0b68c59](https://github.com/djm204/agent-skills/commit/0b68c5927fdcfab1a8ecf374258da2040d581c9b))
* update name in readme ([1bd34a7](https://github.com/djm204/agent-skills/commit/1bd34a7da97c508bd587909b3ec48dfb6ed9870c))


### Documentation

* add compatibility badges for Cursor IDE and Claude Code ([82a58ed](https://github.com/djm204/agent-skills/commit/82a58ed4f586cbd6a451ab51a1407b97850586ef))
* add compatibility badges for Cursor IDE and Claude Code ([93b2c07](https://github.com/djm204/agent-skills/commit/93b2c07131754a223275eb7fe1649d149b0d7d32))
* add project documentation ([9f9ab04](https://github.com/djm204/agent-skills/commit/9f9ab04d5fe69bde418a05a45396343b9a24ba7c))
* fix file structure diagram in README ([ec9baad](https://github.com/djm204/agent-skills/commit/ec9baad41eb37820536ab35055e9ce2a05229f82))
* **readme:** align available templates table with CLI ([#39](https://github.com/djm204/agent-skills/issues/39)) ([e4f2f5b](https://github.com/djm204/agent-skills/commit/e4f2f5b0139af007c0aa15d25b0f57cb5358be79))
* **readme:** update rule file references from .md to .mdc ([3841c67](https://github.com/djm204/agent-skills/commit/3841c6717d3bad607c6d89763e7595d739cbbd7d))
* update README to use correct package name ([07ee097](https://github.com/djm204/agent-skills/commit/07ee0979706a48d7b32902de0ac07fb973b07114))


### CI/CD

* add auto-merge workflow for release PRs ([#19](https://github.com/djm204/agent-skills/issues/19)) ([2ad69d8](https://github.com/djm204/agent-skills/commit/2ad69d89fc29c3a8bf856c42bac85fca141c3840))
* add GitHub Actions workflows ([9b9dd1e](https://github.com/djm204/agent-skills/commit/9b9dd1ec4a462fa1c96f2d455e33ff3a54f8f24e))
* **release:** GitHub generate release notes + workflow lint ([#44](https://github.com/djm204/agent-skills/issues/44)) ([84afff8](https://github.com/djm204/agent-skills/commit/84afff81f5dd7c4ee426d8a30d1828e3345cdd44))
* **release:** upload npm tarball to github release ([f26ce6c](https://github.com/djm204/agent-skills/commit/f26ce6cdf70e8469b69378da0f6c89860b52af39))


### Tests

* add comprehensive unit tests and CI pipeline ([#14](https://github.com/djm204/agent-skills/issues/14)) ([2b9e62c](https://github.com/djm204/agent-skills/commit/2b9e62c1cb44beb4124fc200c5ea0607978d5e82))


### Refactoring

* condense rules to 100 lines and optimize output generation ([#86](https://github.com/djm204/agent-skills/issues/86)) ([c6d9678](https://github.com/djm204/agent-skills/commit/c6d96781d6d20bfb07e23c3ed95215ac4894584a))

## [1.0.0] — Rebrand to @djm204/agent-skills

**Package renamed** from `agentic-team-templates` to `@djm204/agent-skills`.
**CLI command renamed** from `cursor-templates` to `agent-skills`.

The old `agentic-team-templates` package continues to work via a deprecation shim
that delegates to `@djm204/agent-skills`. Existing installs are unaffected.

---

## [0.24.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.23.1...agentic-team-templates-v0.24.0) (2026-02-17)


### Features

* add dogfood script to self-install templates via bin/cli.js ([#90](https://github.com/djm204/agentic-team-templates/issues/90)) ([cbc840b](https://github.com/djm204/agentic-team-templates/commit/cbc840bec4be16b0c1e801a83ed8f1e58ab6051a))
* token optimization — slim CLAUDE.md and on-demand docs ([#88](https://github.com/djm204/agentic-team-templates/issues/88)) ([6ed3f64](https://github.com/djm204/agentic-team-templates/commit/6ed3f64d10d6961934f44338a28fcca1205ece0d))

## [0.23.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.23.0...agentic-team-templates-v0.23.1) (2026-02-08)


### Refactoring

* condense rules to 100 lines and optimize output generation ([#86](https://github.com/djm204/agentic-team-templates/issues/86)) ([c6d9678](https://github.com/djm204/agentic-team-templates/commit/c6d96781d6d20bfb07e23c3ed95215ac4894584a))

## [0.23.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.22.2...agentic-team-templates-v0.23.0) (2026-02-04)


### Features

* **cli:** add logical shorthand aliases for templates ([#84](https://github.com/djm204/agentic-team-templates/issues/84)) ([9e6cbbf](https://github.com/djm204/agentic-team-templates/commit/9e6cbbf214e8d8f4d8c46230d76af46534a344e4))
* **languages:** add Ruby expert template ([#83](https://github.com/djm204/agentic-team-templates/issues/83)) ([31672ee](https://github.com/djm204/agentic-team-templates/commit/31672eec1f341c378fe95953a34cd1a78dedb6b7))
* **templates:** add research-assistant template ([#82](https://github.com/djm204/agentic-team-templates/issues/82)) ([c8e5440](https://github.com/djm204/agentic-team-templates/commit/c8e544075444e7d121cfa247f2a581da7a65121f))

## [0.22.2](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.22.1...agentic-team-templates-v0.22.2) (2026-02-03)


### Miscellaneous

* **templates:** condense oversized .mdc files to under 500 lines ([#80](https://github.com/djm204/agentic-team-templates/issues/80)) ([6f76133](https://github.com/djm204/agentic-team-templates/commit/6f76133cc3c2c6132715182e0b0a96fd47a5e6b5))

## [0.22.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.22.0...agentic-team-templates-v0.22.1) (2026-02-03)


### Miscellaneous

* **docs:** document .mdc format, front matter, and short focused rules ([#77](https://github.com/djm204/agentic-team-templates/issues/77)) ([1d5748e](https://github.com/djm204/agentic-team-templates/commit/1d5748ecdbba7e0fa4a5023332a702904d5fb4fa))
* **rules:** add rules-creation-best-practices.mdc ([#79](https://github.com/djm204/agentic-team-templates/issues/79)) ([86f009a](https://github.com/djm204/agentic-team-templates/commit/86f009aa453260d613f1b805750f8b598787ebdb))


### Documentation

* **readme:** update rule file references from .md to .mdc ([3841c67](https://github.com/djm204/agentic-team-templates/commit/3841c6717d3bad607c6d89763e7595d739cbbd7d))

## [0.22.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.21.1...agentic-team-templates-v0.22.0) (2026-02-03)


### Features

* **languages:** add ruby-expert template ([#75](https://github.com/djm204/agentic-team-templates/issues/75)) ([b8aca6e](https://github.com/djm204/agentic-team-templates/commit/b8aca6e9340e7734f5c359d2bc2faea57663c859))

## [0.21.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.21.0...agentic-team-templates-v0.21.1) (2026-02-02)


### Miscellaneous

* **docs:** update readme ([#73](https://github.com/djm204/agentic-team-templates/issues/73)) ([7ac83ae](https://github.com/djm204/agentic-team-templates/commit/7ac83ae8b7dad47744d95f5e558e2ab4e3c547b1))

## [0.21.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.20.0...agentic-team-templates-v0.21.0) (2026-02-01)


### Features

* **templates:** add 16 new agentic archetype templates ([#69](https://github.com/djm204/agentic-team-templates/issues/69)) ([6587ce2](https://github.com/djm204/agentic-team-templates/commit/6587ce2d6ec2afcc3b9a7fb19e13e60c0c8f608c))

## [0.20.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.19.1...agentic-team-templates-v0.20.0) (2026-02-01)


### Features

* **templates:** add project-manager, supply-chain, executive-assistant, grant-writer templates ([#66](https://github.com/djm204/agentic-team-templates/issues/66)) ([aae6243](https://github.com/djm204/agentic-team-templates/commit/aae62431c5f677adce3ba0d009f9ced89ba0728f))

## [0.19.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.19.0...agentic-team-templates-v0.19.1) (2026-01-31)


### Miscellaneous

* update CLAUDE.md and release-please.yml ([#64](https://github.com/djm204/agentic-team-templates/issues/64)) ([48a488e](https://github.com/djm204/agentic-team-templates/commit/48a488e2812672a4c36a4e7744eef9c4da16e285))

## [0.19.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.18.0...agentic-team-templates-v0.19.0) (2026-01-31)


### Features

* **templates:** organize templates into category subdirectories ([#62](https://github.com/djm204/agentic-team-templates/issues/62)) ([7d7389c](https://github.com/djm204/agentic-team-templates/commit/7d7389c6204c72377080e2a660d8c8513f0ba103))


### Bug Fixes

* **cursor:** copy legacy .cursorrules/ files to .cursor/rules/ before removing directory ([#61](https://github.com/djm204/agentic-team-templates/issues/61)) ([b78f12c](https://github.com/djm204/agentic-team-templates/commit/b78f12c2145aaaf1633c6bb61882da6770f15e67))

## [0.18.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.17.0...agentic-team-templates-v0.18.0) (2026-01-31)


### Features

* **cli:** migrate Cursor rules from .cursorrules/ to .cursor/rules/ ([#59](https://github.com/djm204/agentic-team-templates/issues/59)) ([5518171](https://github.com/djm204/agentic-team-templates/commit/551817101dbb1c8362d5e7f229939f0790f93dc8))

## [0.17.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.16.0...agentic-team-templates-v0.17.0) (2026-01-31)


### Features

* **templates:** add ux-designer template ([#57](https://github.com/djm204/agentic-team-templates/issues/57)) ([bf9489f](https://github.com/djm204/agentic-team-templates/commit/bf9489f97215328e91065c4f6649f95af79beaa0))

## [0.16.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.15.0...agentic-team-templates-v0.16.0) (2026-01-30)


### Features

* **templates:** add educator template ([#54](https://github.com/djm204/agentic-team-templates/issues/54)) ([f1f2f1f](https://github.com/djm204/agentic-team-templates/commit/f1f2f1f099426e0f7f5acab4c43213d06809e0b1))

## [0.15.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.14.0...agentic-team-templates-v0.15.0) (2026-01-30)


### Features

* **cli:** add shorthand aliases for language expert templates ([#53](https://github.com/djm204/agentic-team-templates/issues/53)) ([824ee0d](https://github.com/djm204/agentic-team-templates/commit/824ee0dd1bf700e2d251c3c82808238df8df4c39))

## [0.14.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.13.2...agentic-team-templates-v0.14.0) (2026-01-30)


### Features

* **templates:** add cpp-expert template ([#48](https://github.com/djm204/agentic-team-templates/issues/48)) ([e2e29a5](https://github.com/djm204/agentic-team-templates/commit/e2e29a571a428da27bd25f3d685438ccf50aa1f8))
* **templates:** add csharp-expert template ([#46](https://github.com/djm204/agentic-team-templates/issues/46)) ([f930bad](https://github.com/djm204/agentic-team-templates/commit/f930badc2c2621f10b4250af02d4540d4e20f53f))
* **templates:** add java-expert template ([#47](https://github.com/djm204/agentic-team-templates/issues/47)) ([b8b1de4](https://github.com/djm204/agentic-team-templates/commit/b8b1de4bc582d436c435ffd1b0ea3c4045568b9a))
* **templates:** add kotlin-expert template ([#50](https://github.com/djm204/agentic-team-templates/issues/50)) ([15a14ca](https://github.com/djm204/agentic-team-templates/commit/15a14ca2fde429316121809a93543b39d96999ad))
* **templates:** add swift-expert template ([#52](https://github.com/djm204/agentic-team-templates/issues/52)) ([69fa9b8](https://github.com/djm204/agentic-team-templates/commit/69fa9b83e91208e7ccad6c3f1b7908ba2a74a40d))
* **templates:** extend javascript-expert with TypeScript deep dive ([#49](https://github.com/djm204/agentic-team-templates/issues/49)) ([0edcde8](https://github.com/djm204/agentic-team-templates/commit/0edcde863a44a2ae8bc0b07d60105044fc137b03))

## [0.13.2](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.13.1...agentic-team-templates-v0.13.2) (2026-01-30)


### CI/CD

* **release:** GitHub generate release notes + workflow lint ([#44](https://github.com/djm204/agentic-team-templates/issues/44)) ([84afff8](https://github.com/djm204/agentic-team-templates/commit/84afff81f5dd7c4ee426d8a30d1828e3345cdd44))

## [0.13.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.13.0...agentic-team-templates-v0.13.1) (2026-01-30)


### Miscellaneous

* update installer name ([0b68c59](https://github.com/djm204/agentic-team-templates/commit/0b68c5927fdcfab1a8ecf374258da2040d581c9b))

## [0.13.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.12.1...agentic-team-templates-v0.13.0) (2026-01-30)


### Features

* **templates:** add python-expert template ([#41](https://github.com/djm204/agentic-team-templates/issues/41)) ([49fa65f](https://github.com/djm204/agentic-team-templates/commit/49fa65f59fde3a886ba3820ff31debf1bcde6a27))

## [0.12.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.12.0...agentic-team-templates-v0.12.1) (2026-01-30)


### Documentation

* **readme:** align available templates table with CLI ([#39](https://github.com/djm204/agentic-team-templates/issues/39)) ([e4f2f5b](https://github.com/djm204/agentic-team-templates/commit/e4f2f5b0139af007c0aa15d25b0f57cb5358be79))

## [0.12.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.11.0...agentic-team-templates-v0.12.0) (2026-01-30)


### Features

* **templates:** add golang-expert template ([#34](https://github.com/djm204/agentic-team-templates/issues/34)) ([5f46bb8](https://github.com/djm204/agentic-team-templates/commit/5f46bb8cecfda3fab25e011c89115c1d1b726970))

## [0.11.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.10.0...agentic-team-templates-v0.11.0) (2026-01-30)


### Features

* **templates:** add rust-expert template ([#35](https://github.com/djm204/agentic-team-templates/issues/35)) ([8bc4786](https://github.com/djm204/agentic-team-templates/commit/8bc47863b43f472153960ad3dd5f08e9adc7b67e))

## [0.10.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.9.2...agentic-team-templates-v0.10.0) (2026-01-30)


### Features

* **templates:** add javascript-expert template and register missing templates ([#33](https://github.com/djm204/agentic-team-templates/issues/33)) ([fce118d](https://github.com/djm204/agentic-team-templates/commit/fce118d9ee39731f91fa6b92065b65764bee26ed))

## [0.9.2](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.9.1...agentic-team-templates-v0.9.2) (2026-01-30)


### Miscellaneous

* **docs:** add documentation agentic-team-templates ([#31](https://github.com/djm204/agentic-team-templates/issues/31)) ([a347d7f](https://github.com/djm204/agentic-team-templates/commit/a347d7f83bc445ec65078e23556dc4e08ba61f4d))

## [0.9.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.9.0...agentic-team-templates-v0.9.1) (2026-01-28)


### Bug Fixes

* **ci:** enable auto-merge directly in release-please workflow ([#28](https://github.com/djm204/agentic-team-templates/issues/28)) ([64e1c5d](https://github.com/djm204/agentic-team-templates/commit/64e1c5d79a57720cd8042bca5bf5ca3263f3450e))

## [0.9.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.8.3...agentic-team-templates-v0.9.0) (2026-01-28)


### Features

* **templates:** add product-manager and qa-engineering templates ([#26](https://github.com/djm204/agentic-team-templates/issues/26)) ([9980299](https://github.com/djm204/agentic-team-templates/commit/99802991f0e7bd6baa857fe11b2f64847dedb60b))

## [0.8.3](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.8.2...agentic-team-templates-v0.8.3) (2026-01-28)


### Bug Fixes

* **ci:** quote if expression to fix YAML parsing error ([#24](https://github.com/djm204/agentic-team-templates/issues/24)) ([5038e63](https://github.com/djm204/agentic-team-templates/commit/5038e63707d7fc9bf67c7d9666d3b5fafd198b58))

## [0.8.2](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.8.1...agentic-team-templates-v0.8.2) (2026-01-28)


### Bug Fixes

* **docs:** add blank lines and language specs to README code blocks ([#22](https://github.com/djm204/agentic-team-templates/issues/22)) ([164a003](https://github.com/djm204/agentic-team-templates/commit/164a003bc0cef7fc461bace9861430dc34837cee))

## [0.8.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.8.0...agentic-team-templates-v0.8.1) (2026-01-28)


### CI/CD

* add auto-merge workflow for release PRs ([#19](https://github.com/djm204/agentic-team-templates/issues/19)) ([2ad69d8](https://github.com/djm204/agentic-team-templates/commit/2ad69d89fc29c3a8bf856c42bac85fca141c3840))

## [0.8.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.7.0...agentic-team-templates-v0.8.0) (2026-01-28)


### Features

* **cli:** add changelog link to version output ([#17](https://github.com/djm204/agentic-team-templates/issues/17)) ([d3945ff](https://github.com/djm204/agentic-team-templates/commit/d3945ff713c4c67e7f98bf042cff3f268689d966))

## [0.7.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.6.1...agentic-team-templates-v0.7.0) (2026-01-28)


### Features

* **cli:** add version checking and troubleshooting docs ([8c590a0](https://github.com/djm204/agentic-team-templates/commit/8c590a0bc9ba93857cbf0a20a856e427b6cd60c6))


### Documentation

* fix file structure diagram in README ([ec9baad](https://github.com/djm204/agentic-team-templates/commit/ec9baad41eb37820536ab35055e9ce2a05229f82))
* update README to use correct package name ([07ee097](https://github.com/djm204/agentic-team-templates/commit/07ee0979706a48d7b32902de0ac07fb973b07114))

## [0.6.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.6.0...agentic-team-templates-v0.6.1) (2026-01-28)


### Tests

* add comprehensive unit tests and CI pipeline ([#14](https://github.com/djm204/agentic-team-templates/issues/14)) ([2b9e62c](https://github.com/djm204/agentic-team-templates/commit/2b9e62c1cb44beb4124fc200c5ea0607978d5e82))

## [0.6.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.5.0...agentic-team-templates-v0.6.0) (2026-01-28)


### Features

* **cli:** add --remove and --reset commands for template removal ([#12](https://github.com/djm204/agentic-team-templates/issues/12)) ([4293ebc](https://github.com/djm204/agentic-team-templates/commit/4293ebc23bea4b408d91d3b60926339d518fedc0))
* **templates:** add comprehensive testing template ([#11](https://github.com/djm204/agentic-team-templates/issues/11)) ([cc0ece6](https://github.com/djm204/agentic-team-templates/commit/cc0ece672782d215f2d5b341225d3f42f30679e6))

## [0.5.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.4.2...agentic-team-templates-v0.5.0) (2026-01-27)


### Features

* **cli:** add --ide parameter for selective installation ([f16cb57](https://github.com/djm204/agentic-team-templates/commit/f16cb57450d351cb096d77d1bad3b7ecb196943c))
* **cli:** add --ide parameter for selective installation ([15a2a7c](https://github.com/djm204/agentic-team-templates/commit/15a2a7c3444c1e14c00e5fbccbb4da6db0f807f3))

## [0.4.2](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.4.1...agentic-team-templates-v0.4.2) (2026-01-27)


### Documentation

* add compatibility badges for Cursor IDE and Claude Code ([82a58ed](https://github.com/djm204/agentic-team-templates/commit/82a58ed4f586cbd6a451ab51a1407b97850586ef))
* add compatibility badges for Cursor IDE and Claude Code ([93b2c07](https://github.com/djm204/agentic-team-templates/commit/93b2c07131754a223275eb7fe1649d149b0d7d32))

## [0.4.1](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.4.0...agentic-team-templates-v0.4.1) (2026-01-27)


### Miscellaneous

* update name in readme ([1bd34a7](https://github.com/djm204/agentic-team-templates/commit/1bd34a7da97c508bd587909b3ec48dfb6ed9870c))

## [0.4.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.3.0...agentic-team-templates-v0.4.0) (2026-01-27)


### Features

* **cli:** intelligently merge claude.md sections instead of overwriting ([7ca293c](https://github.com/djm204/agentic-team-templates/commit/7ca293cd1f3a8c5cae1833b7de6ad6c6a9ac9a1b))


### Bug Fixes

* combine claude.md when almost the same ([0d98141](https://github.com/djm204/agentic-team-templates/commit/0d98141957770043b46444a708c7e2781533c22c))
* update repository URLs to match actual repo name ([96a3235](https://github.com/djm204/agentic-team-templates/commit/96a323518152b9fb8f178a26892f58c75b33b6d8))


### Miscellaneous

* **lint:** allow any case in commit subjects ([c4d7388](https://github.com/djm204/agentic-team-templates/commit/c4d73887021946db2e3e67953e1fdfc3baebd83c))
* update author email and github username ([9190dbd](https://github.com/djm204/agentic-team-templates/commit/9190dbd84cc59d45a91078cca2186f12775bffeb))


### CI/CD

* **release:** upload npm tarball to github release ([f26ce6c](https://github.com/djm204/agentic-team-templates/commit/f26ce6cdf70e8469b69378da0f6c89860b52af39))

## [0.3.0](https://github.com/djm204/agentic-team-templates/compare/agentic-team-templates-v0.2.0...agentic-team-templates-v0.3.0) (2026-01-27)


### Features

* add CLI entry point ([3d2a0e4](https://github.com/djm204/agentic-team-templates/commit/3d2a0e40bd40d652880efd90d3476b90503a73d4))
* add root cursorrules ([a115ac5](https://github.com/djm204/agentic-team-templates/commit/a115ac5e40b81b2276fca428eca95bb72175aa07))
* add shared template foundations ([5bd0bc9](https://github.com/djm204/agentic-team-templates/commit/5bd0bc9420814a6363af5073304e48823989c98c))
* **cli:** preserve existing files during installation ([4d90aeb](https://github.com/djm204/agentic-team-templates/commit/4d90aebee36208b5d583b1ed738d5b4fc771a926))
* **templates:** add blockchain template ([327f705](https://github.com/djm204/agentic-team-templates/commit/327f7059150575cc23389f9ea192ec4cdf39589f))
* **templates:** add cli-tools template ([f279722](https://github.com/djm204/agentic-team-templates/commit/f279722d410ddf1e85ad49fb15ff6923c80b964f))
* **templates:** add data-engineering template ([0ba3377](https://github.com/djm204/agentic-team-templates/commit/0ba33771d0e3b5297fce41649d8cea83d3282e60))
* **templates:** add devops-sre template ([f9b102b](https://github.com/djm204/agentic-team-templates/commit/f9b102b7859a9fd914ccca3c3093a494586b487f))
* **templates:** add documentation template ([41deb1f](https://github.com/djm204/agentic-team-templates/commit/41deb1ff1d8a444d26cad932210449109f9d5810))
* **templates:** add fullstack template ([8486e29](https://github.com/djm204/agentic-team-templates/commit/8486e29597af0e0dc0a9355198b95e744dd886e1))
* **templates:** add ml-ai template ([4ac8710](https://github.com/djm204/agentic-team-templates/commit/4ac87106e3ab4929c43ddb85cb84a6cfc2f948cc))
* **templates:** add mobile template ([21c2f6e](https://github.com/djm204/agentic-team-templates/commit/21c2f6ed22393caa6ba94fb112af1f3f1db7f6d4))
* **templates:** add platform-engineering template ([9c12b12](https://github.com/djm204/agentic-team-templates/commit/9c12b12cf41443fb448016a273bbf6a3dee760af))
* **templates:** add utility-agent template ([51a219a](https://github.com/djm204/agentic-team-templates/commit/51a219a195bf3d64241603fcf3a49b8cbe03afdd))
* **templates:** add web-backend template ([2b60450](https://github.com/djm204/agentic-team-templates/commit/2b604504a5b56ae34871f7d01a2b288d2a075c70))
* **templates:** add web-frontend template ([92ca080](https://github.com/djm204/agentic-team-templates/commit/92ca080a4da02d14813339c7b92cf88ffe81a679))


### Bug Fixes

* **ci:** configure release-please for proper semver ([c083807](https://github.com/djm204/agentic-team-templates/commit/c083807ae2b2a0c561a2399dbe73cdad4154388e))


### Miscellaneous

* add .gitignore ([16fb92d](https://github.com/djm204/agentic-team-templates/commit/16fb92d8d0aa95e6d44b7305399d155a85f4c61e))
* add project configuration ([fbb83da](https://github.com/djm204/agentic-team-templates/commit/fbb83da80e40de53cd2d66a73411bbabc3ff3907))
* **main:** release cursor-templates 0.2.0 ([fbac466](https://github.com/djm204/agentic-team-templates/commit/fbac4669823f0dc5f687f1f265d0411f2221668a))
* **main:** release cursor-templates 0.2.0 ([ffda617](https://github.com/djm204/agentic-team-templates/commit/ffda61744ad4ae48a433851a5974a7a6d897f98f))
* remove unnecessary test step from release workflow ([3a3e1f2](https://github.com/djm204/agentic-team-templates/commit/3a3e1f257d2d3e2d70f18c94bb12308117b9d677))


### Documentation

* add project documentation ([9f9ab04](https://github.com/djm204/agentic-team-templates/commit/9f9ab04d5fe69bde418a05a45396343b9a24ba7c))


### CI/CD

* add GitHub Actions workflows ([9b9dd1e](https://github.com/djm204/agentic-team-templates/commit/9b9dd1ec4a462fa1c96f2d455e33ff3a54f8f24e))

## [0.2.0](https://github.com/djm204/agentic-team-templates/compare/cursor-templates-v0.1.0...cursor-templates-v0.2.0) (2026-01-27)


### Features

* add CLI entry point ([3d2a0e4](https://github.com/djm204/agentic-team-templates/commit/3d2a0e40bd40d652880efd90d3476b90503a73d4))
* add root cursorrules ([a115ac5](https://github.com/djm204/agentic-team-templates/commit/a115ac5e40b81b2276fca428eca95bb72175aa07))
* add shared template foundations ([5bd0bc9](https://github.com/djm204/agentic-team-templates/commit/5bd0bc9420814a6363af5073304e48823989c98c))
* **cli:** preserve existing files during installation ([4d90aeb](https://github.com/djm204/agentic-team-templates/commit/4d90aebee36208b5d583b1ed738d5b4fc771a926))
* **templates:** add blockchain template ([327f705](https://github.com/djm204/agentic-team-templates/commit/327f7059150575cc23389f9ea192ec4cdf39589f))
* **templates:** add cli-tools template ([f279722](https://github.com/djm204/agentic-team-templates/commit/f279722d410ddf1e85ad49fb15ff6923c80b964f))
* **templates:** add data-engineering template ([0ba3377](https://github.com/djm204/agentic-team-templates/commit/0ba33771d0e3b5297fce41649d8cea83d3282e60))
* **templates:** add devops-sre template ([f9b102b](https://github.com/djm204/agentic-team-templates/commit/f9b102b7859a9fd914ccca3c3093a494586b487f))
* **templates:** add documentation template ([41deb1f](https://github.com/djm204/agentic-team-templates/commit/41deb1ff1d8a444d26cad932210449109f9d5810))
* **templates:** add fullstack template ([8486e29](https://github.com/djm204/agentic-team-templates/commit/8486e29597af0e0dc0a9355198b95e744dd886e1))
* **templates:** add ml-ai template ([4ac8710](https://github.com/djm204/agentic-team-templates/commit/4ac87106e3ab4929c43ddb85cb84a6cfc2f948cc))
* **templates:** add mobile template ([21c2f6e](https://github.com/djm204/agentic-team-templates/commit/21c2f6ed22393caa6ba94fb112af1f3f1db7f6d4))
* **templates:** add platform-engineering template ([9c12b12](https://github.com/djm204/agentic-team-templates/commit/9c12b12cf41443fb448016a273bbf6a3dee760af))
* **templates:** add utility-agent template ([51a219a](https://github.com/djm204/agentic-team-templates/commit/51a219a195bf3d64241603fcf3a49b8cbe03afdd))
* **templates:** add web-backend template ([2b60450](https://github.com/djm204/agentic-team-templates/commit/2b604504a5b56ae34871f7d01a2b288d2a075c70))
* **templates:** add web-frontend template ([92ca080](https://github.com/djm204/agentic-team-templates/commit/92ca080a4da02d14813339c7b92cf88ffe81a679))


### Bug Fixes

* **ci:** configure release-please for proper semver ([c083807](https://github.com/djm204/agentic-team-templates/commit/c083807ae2b2a0c561a2399dbe73cdad4154388e))


### Miscellaneous

* add .gitignore ([16fb92d](https://github.com/djm204/agentic-team-templates/commit/16fb92d8d0aa95e6d44b7305399d155a85f4c61e))
* add project configuration ([fbb83da](https://github.com/djm204/agentic-team-templates/commit/fbb83da80e40de53cd2d66a73411bbabc3ff3907))
* remove unnecessary test step from release workflow ([3a3e1f2](https://github.com/djm204/agentic-team-templates/commit/3a3e1f257d2d3e2d70f18c94bb12308117b9d677))


### Documentation

* add project documentation ([9f9ab04](https://github.com/djm204/agentic-team-templates/commit/9f9ab04d5fe69bde418a05a45396343b9a24ba7c))


### CI/CD

* add GitHub Actions workflows ([9b9dd1e](https://github.com/djm204/agentic-team-templates/commit/9b9dd1ec4a462fa1c96f2d455e33ff3a54f8f24e))
