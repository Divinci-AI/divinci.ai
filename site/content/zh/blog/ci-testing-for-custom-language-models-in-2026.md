+++
title = "2026 年定制语言模型的 CI 测试"
description = "契约测试、冒烟预算、成本感知的车队规模配置以及影子 CI。如何在不拖慢团队的前提下,让 12 分钟的评估套件在每个 PR 上都保持可控。"
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "images/ci-testing-for-custom-language-models-in-2026-hero.png"
reading_time = 13
summary = "第 7 篇文章中的回归套件在每个 PR 上运行都要花真金白银。这就是我们如何在保持同等覆盖率的同时大幅降低成本——亚秒级契约测试、90 秒的冒烟层、嵌入缓存 + 评审器批处理,以及任何门禁开始拦截前 2 周的影子窗口。本系列的收官之作。"
+++

*发布周期笔记 — 第 8 部分(完结篇)*

你交付了[第 7 篇](/zh/blog/automated-regression-testing-for-custom-llms-in-2026/)中的回归套件。它工作得很好。切片感知的门禁抓住了真正的 bug。校准过的评审器稳如磐石。

然后你的工程负责人问你,这套东西在每个 PR 上跑要花多少钱。你算了一笔账:每个 PR 大约 12 分钟的评审器推理,一天 60 个 PR,四个维度 × 十七个切片,账单是真金白银。更糟的是,现在每个开发者都要为一行 prompt 拼写错误等 12 分钟才能拿到绿勾。速度下降<sup><a href="#ref-1">[1]</a></sup>,团队怨声载道,有人提议"干脆每晚跑一次门禁吧"——而这恰恰就是放弃门禁本该做到的一切。

修复之道不是减少测试。修复之道是**分层测试,大部分信号在前九十秒内就抵达。**这篇文章讲的是门禁套件下面跑的东西:亚秒级契约测试、紧凑的冒烟层、成本感知的车队,以及任何新门禁开始拦截任何人之前 2 周的影子窗口。

这是本系列的第 8 篇,也是最后一篇。读完之后你就拥有了完整的图景——从[四阶段流水线](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)一直到在每次提交时运行的契约测试夹具。

## 对于定制语言模型来说 CI 意味着什么?

定制 LLM 的 CI 就是门禁套件不必重复做的工作。门禁评分语义质量;CI 则在门禁花掉哪怕一个评审器 token 之前,抓住一切会让门禁评分变得毫无意义的问题。

契约测试以毫秒计运行,验证 prompt 模板是否仍能渲染、工具调用 schema 是否仍能解析、检索索引是否仍有响应、清单(manifest)是否仍引用着实际存在的哈希。它们是确定性的、免费的,也是流水线其余部分能够存在的唯一原因。一个把 prompt 模板搞坏的 PR 应该在 200 毫秒内失败,而不是在 12 分钟的评审器推理评估出胡话之后才失败。

契约层的存在与否,决定了你的 CI 账单是随 PR 量线性扩张,还是不。Divinci 的 CI 运行器把超过 90% 的评审器预算花在真正的语义评估上,而不是花在本来就会通不过 schema 检查的 PR 上。这个比例,就是头条数字。

## 为什么传统 CI 对 LLM 失效——从成本视角看

[第 1 篇](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)和[第 7 篇](/zh/blog/automated-regression-testing-for-custom-llms-in-2026/)讲过确定性 CI 为何对生成式模型失效。本篇要讲的版本,不是这四种属性存不存在,而是它们的**成本**形态。

| LLM 的属性 | 传统 CI 的失败方式 | 成本形态 |
|---|---|---|
| 非确定性输出 | 精确匹配断言会不稳定 | 重跑会随抖动率线性放大成本 |
| 多维度质量 | 单一布尔值信息量太低 | 每个维度都是一次单独(付费)的评审器调用 |
| 厂商漂移 | 钉住的 `gpt-4-2024-01-01` 悄无声息下线 | 厂商日落某个检查点时,会爆发出一波重新校准成本 |
| 非局部 prompt 效应 | 本地单元测试无法捕捉这种效应 | 分布形态在 PR 之间发生变化,而非在 PR 内部——需要对整套套件重跑,而非增量跑 |

CI 架构必须让上述每一项都负担得起。契约测试以低成本处理属性 1 和 3。冒烟测试部分处理属性 4。只有完整套件能处理属性 2——而且只在真正需要的 PR 上运行。

## CI 分层蛋糕——从亚秒到二十五分钟

我们交付的架构是四层,每一层都通过抓住下面更便宜的层抓不到的东西来挣回自己的算力。每一层的切片感知框架遵循[天盘 Semver 谎言事后复盘](/zh/blog/automated-regression-testing-for-custom-llms-in-2026/)说得很清楚<sup><a href="#ref-4">[4]</a></sup>的同一个教训:聚合信号会撒谎;按切片信号能抓住聚合所掩盖的东西。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="四层 CI 架构:亚秒级契约测试、90 秒冒烟、12 分钟完整套件、25 分钟生产追踪回放">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">CI 分层蛋糕 — 每一层都收窄抵达下一层的 PR 漏斗</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">大多数 PR 只触及上面两层。每 PR 成本数字为内部数据——在 Divinci 生产 CI 上实测。</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① 契约 · 每次提交 · &lt; 1 秒 · ~$0.00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">schema · 模板渲染 · 禁用词列表 · 清单完整性 · 索引可用性</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% 的提交</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② 冒烟 · 每个 PR · ~90 秒 · ~$0.05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">前 3 个切片上 20–30 个关键用例 · 仅任务 + 安全</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% 的 PR</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ 完整套件 · prompt / 模型 / 检索类 PR · ~12 分钟 · ~$0.80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500 个用例 · 4 个维度 · 所有切片 · 按切片 Spearman 门禁</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~22% 的 PR</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ 生产追踪回放 · 候选发布 · ~25 分钟 · ~$2.40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">14 天回放窗口 · 同一校准过的评审器 · 离线 ↔ 回放差距分析</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~4% 的 PR</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">每 PR 加权聚合成本(按漏斗加权):~$0.27。聚合 p95 墙钟时间:~3.4 分钟。</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">各层墙钟时间、按层成本与漏斗比率为内部数据——在 Divinci 生产 CI 上,以一个代表性客户(~500 个黄金数据集用例、17 个切片、~60 PR/天)实测。</figcaption>
</figure>

成本形态就是设计。~74% 的 PR 从不花一分评审器 token——契约或冒烟就够了。真正抵达完整套件的 PR,是那些改动了 prompt、模型配置、检索索引或评估代码的——也正是这些改动,门禁套件是唯一值得信任的信号。候选发布则是抵达第 4 层的少数。

## 契约测试——不公平的优势

契约测试是第一道防线、最便宜的一道防线,也是大多数团队会跳过的一道防线,因为他们觉得这层东西配不上"AI 评估流水线"的身份。然而,在我们客户的套件中,有 30–40% 的本可成为回归的问题,实际上正是在这一层失败——在任何评审器被调用之前。

契约层只断言以下五件事,别无其他:

1. **Prompt 模板渲染。**每个模板都能在一份规范化夹具上完成渲染,不存在未绑定变量、失控循环或损坏的类 Jinja include。
2. **工具调用 schema。**每个声明工具的参数 schema 能解析,JSONSchema 有效,渲染后的 prompt 真的引用了所有必填槽位。
3. **清单完整性。**发布清单中的每个 SHA——模型、prompt、检索索引、评审器、数据集——都对应注册表中实际存在的工件。悬挂指针在这里失败,而不是在更下游的三层之后。
4. **索引可用性。**检索索引能在预算内回应一个已知查询。被悄悄破坏检索能力的重建索引,会在这里浮现,而不是在生产中。
5. **禁用词列表与 token 预算。**任何引入了禁止 token、超过单次调用 token 预算或渲染超出上下文窗口的 prompt 模板,都在这里失败。启发式语义相似度评分<sup><a href="#ref-6">[6]</a></sup>也足够便宜,可以在契约层运行,以覆盖字面字符串匹配不足以覆盖的模糊匹配禁用词。

```bash
# 一次有代表性的契约测试调用 — 大约 600 毫秒完成
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

这些调用没有一个会触及评审器。没有一个是非确定性的。没有一个会花掉可测量的钱。而它们中的每一个,都能排除掉一整类"门禁套件说医疗切片回归了"的告警——而那些告警本应浪费 12 分钟的评审器推理,去给一个模型从一开始就不可能正确生成的输出打分。

## 冒烟层 — 90 秒、每 PR ~$0.05

如果说契约层是廉价的不公平优势,冒烟层就是真正能以一杯咖啡的价格抓住回归的那一层。从最高流量的切片里抽出 20 到 30 个用例,**只对任务完成度和安全性**打分,不对忠实度、延迟或检索锚定做检查。每个 PR 都跑这一层。它大约耗时 90 秒,因为这些用例被批处理进一次评审器调用,并使用结构化输出 schema,而评审器用的是廉价的校准评审器——不是发布候选所用的高质量版本。

我们在回归日志里追踪每个已交付修复是被哪一层抓到的,在过去六个月的客户部署中,直方图一直稳定:

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="柱状图显示回归在何处被抓住:契约层 31%、冒烟 27%、完整套件 28%、回放 11%、3% 漏到生产">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">回归在哪里被抓住 — 按层分,过去 6 个月跨客户部署</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">大多数回归死在最便宜的层。昂贵的层在残余项上挣回自己的成本。</text>
<g transform="translate(90, 100)">
<line x1="0" y1="200" x2="780" y2="200" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">40%</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">30%</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">20%</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">10%</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0%</text>
</g>
<g>
<rect x="40" y="45" width="120" height="155" fill="#7a8a4a" stroke="#1e3a2b" stroke-width="1"/>
<text x="100" y="36" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">31%</text>
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">契约</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1 秒 · $0.00</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27%</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">冒烟</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90 秒 · $0.05</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28%</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">完整套件</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12 分钟 · $0.80</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11%</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">回放</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25 分钟 · $2.40</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3%</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">漏出</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ 回滚</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">滚动六个月聚合,跨 Divinci 活跃 CI 部署。汇报为已确认回归中,所列层是首次失败的占比。内部数据——由我们实测。</figcaption>
</figure>

漏出的那 3% 就是[第 5 篇的即时回滚](/zh/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)存在的原因。门禁不承诺零漏出;它们承诺一个紧致的上界,以及对于漏出者的快速恢复。

## CI 车队规模 — 12 分钟套件如何保持便宜

完整套件这一层就是数学必须自洽的地方。一个朴素实现会按 用例 × 维度 各调用一次评审器、顺序运行,账单随用例数线性扩张。三项优化几乎承担了让其保持可控的全部工作:

**嵌入缓存。**每个黄金数据集用例的检索上下文指纹都会被哈希;如果用例没有变化、检索索引也没有变化,缓存的嵌入即视为有效,检索步骤被跳过。在我们客户部署中,第一个稳定周之后的命中率一直稳定在 90% 以上。

**评审器批处理。**校准过的评审器使用结构化输出调用,每次调用批量处理 8–16 个用例。评审器的按 token 单价不变;按用例摊销的开销下降,因为系统 prompt 在整批中被摊销。安全批处理的阈值由评审器自身在该批大小下的校准一致性决定<sup><a href="#ref-2">[2]</a></sup>——我们在每周的评审器校准流程中实测这一指标([第 7 篇](/zh/blog/automated-regression-testing-for-custom-llms-in-2026/))。

**跨用例的 KV 缓存复用。**对于每次调用都以相同系统 prompt 和工具定义开头的模型,该前缀的 KV 缓存按整套套件运行一次,而不是按用例每次重算<sup><a href="#ref-3">[3]</a></sup>。在开放权重部署上这很直接;在闭源 API 模型上则取决于厂商对前缀缓存的支持。

合并后的效果让完整套件落在上文分层蛋糕图所示的成本数字附近。具体数字是内部数据,但比例才是公开主张:**~74% 的 PR 花零评审器美元;~22% 花几分钱;剩下的 4% 为我们已知能产出的最高置信度上线前信号,花掉几美元。**

## 影子 CI — 开启它而不破坏团队

我们最常看到团队犯的一个错误,就是在第一天就把一个新门禁从"关闭"直接翻到"拦截"。阈值是用昨天的数据调出来的,假阳性率未知,而当门禁第一次触发时,团队没有任何校准可以判断这是真的还是误报。值班的评估工程师被叫起,门禁被关掉,信任崩塌,项目就此死去。

修复之道是 *影子 CI*:让新门禁以非拦截方式跑两周,在每个 PR 上以机器人评论的形式发布结果,在翻为拦截之前每周复核假阳性率。Divinci CI 运行器有一个 `--shadow` 标志正是为此而设。PR 评论看起来和最终的拦截版本一模一样——同样的 diff 显示、同样的按切片分解——只是它不会拦截合并。

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

当假阳性率在窗口内持续低于 5%,我们就翻开关。当达不到时,我们收紧按切片阈值、重新校准评审器、再次影子运行。无论哪种情况,团队都不会被一个第一天就触发的新门禁伏击。

## 一个真正能组合的 GitHub Actions 工作流

把分层蛋糕接入你现有 CI 的那一块,运行在 `.github/workflows/llm-ci.yaml` 里。各层被串接,使得便宜的快速失败,昂贵的只在必要时运行——`needs:` 链和路径过滤触发器承担了这一工作<sup><a href="#ref-5">[5]</a></sup>。

```yaml
name: LLM CI
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'config/models.yaml'
      - 'eval/**'
      - 'retrieval/**'
      - 'manifests/**'
jobs:
  contract:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci contract --manifest manifests/staging.yaml --fail-fast
  smoke:
    needs: contract
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=smoke --post-pr-comment
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
  full:
    needs: smoke
    if: contains(steps.changes.outputs.paths, 'prompts/') || contains(steps.changes.outputs.paths, 'config/models.yaml')
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=full --post-pr-comment --gate
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
```

注意三件事。各层通过 `needs:` 串接,所以契约失败时冒烟不会跑,冒烟失败时完整套件也不会跑。`full` 任务通过路径过滤限定到真正值得跑 12 分钟的变更——README 上的拼写修复不会触发门禁套件。`--post-pr-comment` 标志让按切片的 diff 不必离开 GitHub 就能看见。

## PR 失败的调试回路

"门禁触发了"的另一半,就是"告诉我为什么"。回归套件输出一句 `medical 切片任务完成度下降 0.04`,如果没有引发它的用例,是无法行动的。我们在 PR 评论里展示最差的 5 个按切片差异,附带原始输入、基线输出、候选输出,以及评审器的推理轨迹。调试回路被设计为耗时秒级,而不是分钟级:

```bash
# 拉取在本 PR 上触发 medical 切片门禁的 5 个最差用例
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

这与[第 6 篇的 7 步树](/zh/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)是同一个诊断面,只是接入了 CI 反馈回路。提交 PR 的工程师在 PR 上就能看到用例级证据;不必去打开一个单独的评估仪表盘。

## 版本控制纪律 — prompt、数据集、评审器即代码

Prompt 模板、黄金数据集和评审器 prompt 全部存活在仓库里,在发布清单中以哈希钉死。清单是把整套套件绑定到某个可复现状态的单一对象:

```yaml
# manifests/staging.yaml — 每次 CI 运行都对它进行哈希
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

当一次 CI 运行发布一个分数时,该分数会被打上对应的清单哈希。当分数发生位移时,"是哪个输入挪动了"有了直接答案:对清单做 diff,触发的那一层告诉你应该先看哪个维度。这就是[第 1 篇四阶段流水线](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)和[第 4 篇的 vIndex 回执](/zh/blog/validating-and-releasing-custom-lms-in-regulated-fields/)合起来要闭合的回路:清单就是这八篇文章在不同视角下,一直在构建的那个审计原语。

## 这套方法没解决什么

依然是我们在本系列每篇里都坦诚写下的三条限制。

1. **CI 不会测试不在套件里的东西。**无论分层蛋糕多巧妙,它能抓到的回归只有黄金数据集中某个用例本会标记出来的那些。回放层缓解了行为漂移问题,但从未见过的新颖查询,仍然会一直漏到生产中才被发现。这套系统必须与生产监控配对。
2. **成本数字会随模型定价变化。**本文中的每个成本数字都依赖于评审器 token 价格、嵌入价格和推理价格,而这些每季度都会漂移。比率——74% / 22% / 4%、31% / 27% / 28% / 11% / 3%——才是承重的主张;美元数字仅是某一时刻的示意。
3. **厂商侧的检查点变更仍然很难处理。**当闭源 API 厂商悄悄更新了某个稳定名称背后的模型,契约层抓不到;只有门禁套件能抓到,而且只能事后抓到。我们的缓解办法是:在厂商支持的地方钉住显式检查点标识符,并把检查点被宣布的那一天视为对完整套件重做基线的触发事件。我们无法预防根因。

## 系列收尾

这是 8 篇中的第 8 篇。完整弧线:

1. [如何用 Divinci AI 构建 LLM CI/CD 流水线](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — 四阶段流水线(Register / Gate / Roll / Observe),其后一切都生活在它之内。
2. [定制语言模型中 10 种 CI/CD 发布失败](/zh/blog/10-ci-cd-release-failures-in-custom-language-models/) — 2026 年具名失败模式,每一种都映射到本应抓住它的阶段。
3. [面向 LLM 的 12 项 QA 与发布管理能力](/zh/blog/12-qa-and-release-management-capabilities-for-llms/) — 能力矩阵与三阵营维恩图,将 Divinci 置于与替代方案的对照中。
4. [在受监管领域验证与发布定制 LM](/zh/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — 合规深度剖析、监管机构到阶段的映射、vIndex 回执。
5. [带即时回滚的自动化 LLM CI/CD 流水线](/zh/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — 运营层、自动化光谱、自动回滚回执。
6. [如何用 7 步诊断定制 LLM QA 失败](/zh/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — 诊断决策树;大约每七次告警中,只有一次真正的答案是"模型"。
7. [2026 年定制 LLM 的自动化回归测试](/zh/blog/automated-regression-testing-for-custom-llms-in-2026/) — 切片感知的 Spearman 门禁、校准过的评审器、闭环的生产追踪回放。
8. **本篇。**让上述一切在每个 PR 上都可行的 CI 基础设施。

各部分相互组合:[清单](/zh/api/)是审计原语,门禁是安全层,诊断树是恢复回路,[vIndex 回执](/zh/compliance/)是外部锚点,而分层蛋糕让整套东西在每次提交时都负担得起。如果你的定制 LLM 发布流程没有把这五者凑齐,这八篇文章一直在讲的,就是其中的缺口。

## FAQ

**我能在每次提交时跑的最便宜的测试是什么?**

一个 prompt 模板渲染检查。它以毫秒计运行,无需评审器,能抓到出乎意料一部分的破损,且永远不会花掉一分可测量的钱。如果你还没在跑它,这是我们所知 CI 中 ROI 最高的单项。

**我应该预期定制 LLM CI 流水线花多少钱?**

典型 PR 每个几分钱,候选发布 PR 每个低位个位数美元。比例取决于评审器价格,以及你的 PR 中有多大比例触及 prompt 或模型配置。上文 4% 的候选发布占比是典型值;对于 prompt 迭代频繁的产品,该占比会上升,均值也随之走高。

**我应该在每次提交时都跑完整套件吗?**

不应该。用路径过滤把它限定到触及 prompt、模型配置、检索或评估代码的 PR。对于其他变更,契约 + 冒烟就够用;而在 README 拼写修复上等 12 分钟,会让你在一个 sprint 之内失去团队的信任。完整套件很珍贵;把它花在变更确实可能挪动某个质量维度的地方。

**我如何引入一个新门禁而不破坏所有人?**

两周影子窗口,非拦截。根据影子期间观察到的假阳性率调阈值。只有当持续假阳性率低于你的容忍度(我们用 5%)时才翻为拦截。其他做法都是教大家学会忽视一个门禁。

**如果只追踪一个数字,我应该追踪哪个?**

在生产前被抓住的已确认回归占比。本文的直方图把这个数字定在成熟 Divinci 部署中的 ~97%。漏出的 3% 就是即时回滚存在的原因。那 97% 才是套件存在的意义。

## 参考文献

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — CI velocity, change-failure-rate and time-to-restore-service."</a> 跨行业基线,使"每 PR 12 分钟太慢"成为一个可辩护的主张,而不是一种意见。
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. 经验证据表明,在冒烟与完整层所用的批量大小下,批处理的 LLM-as-judge 调用可保持校准——这是本文成本数字得以成立的原因。
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">"Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. CI 车队规模章节引用的 KV 缓存复用与前缀共享技术。
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 2026 年 4 月 29 日。2026 年仅依赖聚合的回归套件具名失败模式;CI 分层蛋糕从头到尾都坚持切片感知的原因。
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">"GitHub Actions — chaining jobs with `needs:` and conditional execution."</a> 本文 .yaml 所组合的基础原语。
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">"BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. 作为更便宜层的 LLM-as-judge 替代项,引用的启发式语义相似度度量;并非我们在门禁时所用,但在契约层用于大规模禁用短语检测时很有用。
  </li>
</ol>
