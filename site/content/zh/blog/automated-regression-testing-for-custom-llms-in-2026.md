+++
title = "2026 年自定义 LLM 的自动化回归测试"
description = "如何构建一套能够捕获评估自身漂移(而不仅仅是模型漂移)的回归测试套件。切片感知门控、经过校准的评判器、生产追踪回放。"
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-regression-testing-for-custom-llms-in-2026-hero.webp"
reading_time = 13
summary = "大多数所谓的 LLM “回归”实际上是评估套件自身的漂移 —— 评判器校准、切片覆盖、提示词模板、检索索引。本文呈现的是能够捕获这些漂移的套件,按切片打分,使用经过校准的评判器,并针对线上生产追踪进行回放。"
+++

*发布周期笔记 —— 第 7 部分*

周五下午 4:47,你提交了一个仅一字符的提示词微调。聚合评估得分从 0.873 变为 0.871 —— 完全在噪声地板之内。周一早上,你的客服队列被一类查询点燃了 —— 半年前你停止关注这类查询,因为它们一直很稳定。

模型没有任何回归。模型还是同一个模型。**是评估自身从你脚下漂走了。** 半年来某个客户细分群体的缓慢增长从未进入黄金数据集;评判器提示词上一次针对人工标注校准是十月份;检索索引上周三在一个刷新过的嵌入模型上悄悄重建了自己。

这正是第 6 篇所指出的 —— [大约每七次告警中只有一次,模型才是正确答案](/zh/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)。这意味着你的回归测试套件必须能够检测套件自身的漂移,而不仅仅是模型的漂移。本文就是这套套件。

## 自定义 LLM 的回归测试究竟是什么?

软件回归测试断言:对于固定输入,`output == expected`。它们能工作,是因为函数是确定性的。

语言模型在同样的意义上并不是函数。同一个提示词在 temperature > 0 时会产生一个有效补全的分布,而“有效”是多维的:它有没有回答问题、答案是否扎根于检索到的上下文、有没有停留在安全边界之内、有没有在延迟预算内返回。所以对自定义 LLM 做回归测试意味着 **测量行为分布对照一个冻结的基线分布** —— 跨越对你有意义的切片,使用经过人工校准的评判器,并基于看起来像生产流量的输入进行测量。

在这一切真正有意义之前,有三件事必须就位:

1. 一个 **黄金数据集**,在切片层面而不仅是聚合层面上与生产相似。
2. 一个 **经过校准的评判器** —— 不是“我们用 GPT-5 当评判器”,而是“我们测得对照三位人工评分者的 Spearman ρ ≥ 0.7,上周刚刚刷新过”。
3. 一份 **基线清单** —— 那些得分对应的精确模型权重、提示词模板、检索索引和评判器版本。如果没有这个,你就无法分辨得分变动是因为模型变了还是因为尺子变了。

Divinci 将这三者作为一等对象运行,通过哈希链接,在每次提交时打分。本文剩余部分就是如何把它们组装起来。

## 为什么大多数 LLM 回归套件抓不到真正的回归

2026 年自定义 LLM 占主导地位的失败模式,正是 Tianpan 的 Sigma Inference 团队在其 2026 年 4 月事后复盘中命名的 *Semver 谎言*<sup><a href="#ref-1">[1]</a></sup>:一个聚合指标维持平稳或者改善,而其中一两个生产切片在静默回归。该切片在设计测试时不到流量的 5%,所以从未进入黄金数据集;半年后,它占到流量的 12%,模型在该切片上退化了,而聚合数字永远不可能注意到。

我们查阅了过去十八个月所有公开的 LLM 发布事后复盘,模式不断重复:**套件之所以亮绿灯,是因为它在测错的东西。** 具体来说:

- 黄金数据集是团队在发布时手工编写的,从未根据偏移后的流量分布重新分层。
- LLM-as-judge 的提示词设置了一次,之后再没有针对人工标签重新校准。评判器一致性悄然衰减<sup><a href="#ref-2">[2]</a></sup>。
- 基线分数以原始数字形式存储,而不是作为 `(model_sha, prompt_sha, judge_sha, dataset_sha, score)` 元组 —— 所以当某个东西回归时,没人能说清这四个里哪一个动了。

任何回归套件如果没有把这三件事都解决,就只是一个在部署时变绿、给你虚假信心的 CI 步骤。修复方法不是“加更多用例”。修复方法是 **每次发布时,按切片感知、按版本锚定、按评判器校准** 的测量。

## 构建一个经得起切片感知分析的黄金数据集

我们默认提供的四桶组成 —— 生产样本 60%、对抗样本 15%、专家精选边界情况 15%、失败回放 10% —— 是合理的起点。真正让它能够抓到回归的,是附加在每个用例上的 **切片元数据**。

数据集中的每一项都携带:输入、期望行为(评分准则,而非精确字符串)、检索上下文(如有)和一个 `slice` 标签 —— 领域、用户细分、查询意图、语言、长度区间,任何对你的产品有意义的分解维度。套件 **按切片** 打分,任何切片只要跌过其阈值就阻塞发布,即便聚合分数上升也不行。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="黄金数据集组成:60% 生产样本、15% 对抗样本、15% 专家边界情况、10% 失败回放,全部跨切片分层">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">黄金数据集组成 —— 每个维度按切片分层</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">按 ~500 个用例规模设计。柱状分段成比例。硬性要求是每个切片的覆盖度,而非聚合比例。</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">生产样本</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">对抗样本</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">专家边界</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">回放</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">分层生产追踪 · 每季度刷新</text>
<text x="513" y="90" text-anchor="middle">越狱 · 注入</text>
<text x="627" y="90" text-anchor="middle">领域边界 · 长尾</text>
<text x="722" y="90" text-anchor="middle">事后复盘回放 ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">每个用例携带切片标签 —— 套件对每种组合单独打分</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">领域</tspan> · 法律 / 医疗 / 通用</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">意图</tspan> · 教程 / 事实 / 拒答</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">语言</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">长度</tspan> · 短 / 中 / 长</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">细分</tspan> · 企业 / 中小</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">检索</tspan> · 有据 / 开放</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">工具调用</tspan> · 0 / 1 / 多步</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">新颖度</tspan> · 已见 / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">组成 × 切片 = 打分网格</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">每次发布按切片打分 —— 每个切片相对基线的 Spearman ρ ≥ 0.7</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">任何越过阈值的切片都会阻塞发布。聚合分数仅作参考。</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">示意图为结构性图示。分层轴与每切片阈值在 Divinci 发布清单中针对产品逐一配置。内部 —— 在我们自己的部署中定义。</figcaption>
</figure>

我们已经学会强制执行的两条操作规则:

**每季度重采样。** 生产流量分布的偏移速度比大多数团队的测量频率更快。我们每个季度都会针对最近 90 天的流量重新分层生产样本桶;如果任何切片增长超过流量的 5% 且在黄金数据集中占比不足 2%,就会在下一次发布前回填进去。

**每次事后复盘都新增一个用例。** 进入生产却未被捕获的回归,就是数据集中缺失的用例。我们会在事后复盘后 48 小时内将它添加到回放桶中,并打上揭示它的那个切片的标签。

## 如何在用户之前发现漂移?

漂移有四种截然不同的类型,只盯着最后一种的回归套件,会错过大多数回归。

| 漂移类型 | 变动了什么 | 检测信号 | 行动 |
|---|---|---|---|
| **质量漂移** | 评判器对固定切片的打分 | 每切片相对基线的 Spearman ρ 下降 | 阻塞发布;按 [第 6 篇的诊断树](/zh/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) 诊断 |
| **覆盖漂移** | 生产流量分布相对于黄金数据集分布 | 切片占比之间的 KL 散度 | 重采样黄金数据集 |
| **评判器漂移** | 评判器模型与人工的一致性 | 相对于冻结的人工标注审计集的 Spearman ρ | 重新校准评判器提示词或更换评判器 |
| **生产漂移** | 同一模型上的线上生产分数 vs 离线分数 | 生产追踪回放分数差距 | 排查检索 / 预处理 / 运行时 |

大多数套件测量的是质量漂移;另外三种才是周五下午回归通常隐藏之处。Divinci 对照基线清单跟踪所有这四种,每个 PR 上都会显示每切片的得分分解,每周还有一项评判器校准任务在漂移累积之前就标记出来。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="一张 30 天图表,显示聚合任务完成度得分维持在 0.87 平稳,而医疗领域切片悄然从 0.88 跌至 0.74">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">可视化的 Semver 谎言 —— 30 天任务完成度得分</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">聚合(深绿)保持平稳。医疗切片(红)静默回归。聚合门控从未触发。</text>
<g transform="translate(80, 100)">
<line x1="0" y1="0" x2="0" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<line x1="0" y1="250" x2="640" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">0.95</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">0.90</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">0.85</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">0.80</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0.75</text><line x1="-4" y1="200" x2="0" y2="200" stroke="#1e3a2b"/>
<text x="-10" y="254" text-anchor="end">0.70</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="0" y="268" text-anchor="middle">d-30</text>
<text x="160" y="268" text-anchor="middle">d-22</text>
<text x="320" y="268" text-anchor="middle">d-15</text>
<text x="480" y="268" text-anchor="middle">d-7</text>
<text x="640" y="268" text-anchor="middle">今日</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">聚合门控阈值 —— 0.89</text>
<polyline points="0,40 50,42 100,38 150,40 200,42 250,38 300,40 350,38 400,40 450,42 500,38 550,40 600,42 640,40" fill="none" stroke="#5a7a8f" stroke-width="2"/>
<circle cx="640" cy="40" r="4" fill="#5a7a8f"/>
<polyline points="0,60 50,58 100,62 150,60 200,58 250,60 300,62 350,60 400,58 450,60 500,62 550,60 600,58 640,60" fill="none" stroke="#2d5a4f" stroke-width="3.5"/>
<circle cx="640" cy="60" r="5" fill="#2d5a4f"/>
<polyline points="0,72 50,74 100,70 150,72 200,76 250,72 300,74 350,72 400,70 450,72 500,74 550,72 600,76 640,74" fill="none" stroke="#7a8a4a" stroke-width="2"/>
<circle cx="640" cy="74" r="4" fill="#7a8a4a"/>
<polyline points="0,64 50,68 100,66 150,72 200,80 250,92 300,108 350,128 400,150 450,168 500,184 550,196 600,206 640,214" fill="none" stroke="#a04848" stroke-width="3.5"/>
<circle cx="640" cy="214" r="5" fill="#a04848"/>
<g font-family="'DM Sans', sans-serif" font-size="11">
<rect x="656" y="30" width="120" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="2"/>
<text x="664" y="46" font-weight="700" fill="#5a7a8f">法律切片</text>
<text x="722" y="46" fill="#5a7a8f">0.910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">聚合</text>
<text x="722" y="72" fill="#2d5a4f">0.872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">通用</text>
<text x="722" y="98" fill="#7a8a4a">0.863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">医疗切片</text>
<text x="664" y="232" fill="#a04848">今日 0.743 · 越线 ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">切片门控本应在此触发 ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">使用 Divinci 内部切片命名对 Tianpan Sigma 事后复盘模式<sup><a href="#ref-1">[1]</a></sup>的风格化重建。具体数值仅为示意。</figcaption>
</figure>

## 多维评估 —— 每切片同时打四项分

单一的综合得分比四个标量得分的信号更差。我们在四个维度上进行门控:

- **任务完成度** —— 响应是否真的回答了问题,由经过校准的评判器按评分准则给出。切片感知。
- **忠实度** —— 对任何引用了检索上下文的响应,每条主张是否扎根于该上下文。幻觉首先在这里显现。
- **安全性** —— 拒答正确性、越狱抵抗能力、PII / 政策暴露。几乎总是以 ≥ 0.99 通过率作门控;安全是硬墙,不是软折中。
- **延迟预算** —— 切片 SLA 内的 p95。一次让每响应令牌数翻倍的提示词修改即便质量上升也是回归。

每个维度都有自己的每切片基线和每切片阈值。在门控时我们绝不把它们合并为单一加权标量;我们把每个切片的四项分数都展示出来,并阻塞首先越过其阈值的那一项。一个在医疗切片上以 1 分忠实度为代价换取 4 分任务完成度提升的模型仍然是回归。

## 哪些门控应阻塞自定义 LLM 的部署?

我们运行三层架构,每一层为流水线中的不同阶段把关([阶段分类参见第 1 篇](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/))。

**第 1 层 —— 冒烟测试(每次提交,约 90 秒)。** 从影响最大的切片中抽取 20 到 30 个关键用例。在完整套件耗费算力之前捕获灾难性回归。如果冒烟测试失败,其余的不会运行。

**第 2 层 —— 完整套件(每个 PR,约 12 分钟)。** 完整的黄金数据集,在所有四个维度上按切片打分。针对基线清单的切片感知 Spearman ρ。阈值越线阻塞合并。PR 评论列出哪些切片在哪些维度上移动了多少,并附带五个失败示例用例。

**第 3 层 —— 基线对比(发布候选版本,约 25 分钟)。** 候选模型针对最近 14 天的生产追踪进行回放 —— 即我们在[第 1 篇](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)中提到的 *闭环生产追踪回放*。对黄金数据集打分的同一个经过校准的评判器也对回放输出打分。任何切片如果回放得分与离线得分相差超过其阈值,就阻塞发布。这一层正是用来捕获黄金数据集尚不知道的漂移的。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="三层门控决策树:每次提交的冒烟测试,每个 PR 的完整套件,以及发布候选版本的生产追踪回放">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">三层回归门控 —— 每个环节快速失败,每一层逐层加深</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① 冒烟 · 每次提交</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">用例:20–30 个关键用例</text>
<text x="14" y="82">耗时:~90 秒</text>
<text x="14" y="102">维度:仅任务 + 安全</text>
<text x="14" y="122">切片:按流量前 3</text>
<text x="14" y="148" font-weight="600">阻塞:</text>
<text x="14" y="168">灾难性失败</text>
<text x="14" y="186">畸形输出</text>
<text x="14" y="204">安全硬墙越线</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">快速失败 —— 完整套件</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② 完整套件 · 每个 PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">用例:完整 ~500</text>
<text x="14" y="82">耗时:~12 分钟</text>
<text x="14" y="102">维度:任务 / 忠实 / 安全 / 延迟</text>
<text x="14" y="122">切片:全部分层</text>
<text x="14" y="148" font-weight="600">阻塞:</text>
<text x="14" y="168">每切片 ρ &lt; 0.7</text>
<text x="14" y="188">任意切片指标低于阈值</text>
<text x="14" y="208">评判器一致性 &lt; 0.65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">PR 评论列出具体项</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ 回放 · 发布候选</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">用例:14 天线上追踪</text>
<text x="14" y="82">耗时:~25 分钟</text>
<text x="14" y="102">维度:全部四项 · 切片感知</text>
<text x="14" y="122">来源:生产追踪存储</text>
<text x="14" y="148" font-weight="600">阻塞:</text>
<text x="14" y="168">离线 ↔ 回放得分差距</text>
<text x="14" y="188">尚未进入黄金数据集</text>
<text x="14" y="206">的切片中的漂移</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">上线前最后一道门</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">通过</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">通过</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">三层都对照同一份基线清单打分 —— (model_sha, prompt_sha, retrieval_sha, judge_sha) —— 所以一个分数移动可以识别 <tspan font-weight="600" fill="#1e3a2b">哪个</tspan> 维度漂移了,而不仅是 <tspan font-weight="600" fill="#1e3a2b">有某个东西</tspan> 漂移了。</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">耗时数据为内部数据 —— 在 Divinci 生产 CI 运行器上针对具有约 500 个黄金数据集用例和约 14 天生产追踪的代表性客户测得。</figcaption>
</figure>

## 在你信任评判器产生的任何一个分数之前,先校准它

LLM-as-judge 是让这一切超越数百个用例规模扩展的关键。它也是回归套件悄然失效的地方,因为评判器在更新或者你的数据分布偏移时,并没有义务保持校准。

我们针对一个冻结的、至少 100 个用例、与黄金数据集相同切片分层的人工标注审计集对每个评判器提示词进行校准,并且每周重新运行校准。我们的上线门槛是 **Spearman ρ ≥ 0.7**(相对于人工评分者中位数)以及 **Cohen's κ ≥ 0.6**(在二分类安全判断上)。两者都高于 MT-Bench 风格评判器被证明能够以人际一致性水平跟踪人工评分者的阈值<sup><a href="#ref-2">[2]</a></sup>。

当每周校准跌破阈值时,评判器会被自动退役,值班评估工程师会被呼叫。发布流水线宁可让候选发布悬而未决,也不基于一个不再测量它原本所测之物的评判器进行门控。

```bash
# 运行每周评判器校准任务
curl -X POST https://api.divinci.ai/v1/regression/judges/calibrate \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "judge_id":     "rubric-v7",
    "audit_set":    "human-labels-2026-04",
    "min_spearman": 0.70,
    "min_kappa":    0.60,
    "on_fail":      "retire_judge_and_page"
  }'
```

## Divinci 差异化能力 —— 闭环生产追踪回放

第 3 层门控正是大多数回归套件所没有的部分。流程与我们在第 1 篇所发布的相同,只是为回归测试做了一项专门化:每个发布候选版本都会逐切片地将其在离线黄金数据集上的得分与其在 14 天生产追踪回放窗口上的得分进行比较。黄金数据集测量的是我们 *期望* 模型做什么。回放测量的是模型 *上周实际* 会做什么。

当两组分数偏差超过每切片的差距预算时,发布被阻塞。这种不匹配本身就是信号:要么黄金数据集不再具有代表性(覆盖漂移),要么候选模型在由生产预处理与检索塑造的追踪上行为不同(生产漂移)。无论是哪种情况,你都会在用户之前发现。

对离线运行打分的评判器,与对回放运行打分的评判器是同一个。审计日志会记录两组得分、两个评判器版本、被回放的追踪 ID,以及触发阻塞的差距。这个差距本身就是我们拥有的最有用的诊断信号,也是接下来交给负责执行 [第 6 篇诊断树](/zh/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) 的人的内容。

## 用 vIndex 凭据锚定黄金数据集

如果你之后无法复现,套件里的每一个得分都没有意义。我们在每次发布时对黄金数据集进行哈希,并将该哈希与模型 SHA、提示词 SHA、评判器 SHA 和校准记录一起链入 vIndex 凭据。该凭据可外部锚定 —— 审计员可以在六个月后回放我们精确的回归运行并验证我们所声明的分数。

```json
{
  "release_id": "rel_3f1a-2026-05-26",
  "model": { "sha": "0c1f9…", "weights_uri": "r2://models/custom-v7.2", "open_weights": true },
  "prompt": { "sha": "c4a8e…", "template_id": "support-v3.4" },
  "retrieval": { "index_sha": "b21f0…", "embedder": "e5-mistral-7b-instruct" },
  "judge": { "sha": "d8e21…", "rubric_id": "rubric-v7", "spearman_vs_humans": 0.74 },
  "dataset": { "sha": "a90b1…", "n": 512, "slices": 17, "stratified_at": "2026-04-30" },
  "scores": { "aggregate": 0.872, "by_slice": { "/* … */": "/* per-slice scalars */" } },
  "replay": { "trace_window_days": 14, "n_traces": 8430, "max_gap": 0.018 },
  "vindex_anchor": "sha256:f0bfd2…",
  "verifiable_at": "https://vIndex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**开放权重说明。** 上述凭据仅在模型为开放权重时才携带权重溯源 —— vIndex 锚定的是实际的权重字节。对于闭源 API 模型后端(OpenAI / Anthropic / Google 托管模型),凭据仍然携带决策链 —— 每个门控分数、每个评判器结果、校准记录 —— 但权重字段为空,你无法独立验证模型构件。我们在凭据本身和[合规文档](/zh/compliance/)中都明确这一点,这样审计员不会产生错误印象。能从完整的 vIndex 链中受益最多的,是你拥有权重控制权的那些发布。

## 一个我们实际推行过的四阶段实施时间线

试图在第一周就上线完整架构的团队会卡在工具上。下面的顺序是能行得通的顺序。

**阶段 1 —— 基线(第 1 周)。** 抽取过去 30 天生产追踪的分层样本。让两位工程师各自对 100 个用例的任务完成度进行人工标注。计算评分者间一致性(目标 Cohen's κ ≥ 0.6)。你得到的数字就是你的人工基线起点;之后一切都将以此为准进行校准。

**阶段 2 —— 评估框架(第 2–3 周)。** 在 100 用例数据集上搭建评估框架。加入一个对照你的人工标签校准过的评判器。验证框架能以 ρ ≥ 0.7 重现人工分数。大多数团队会发现他们的第一版评判器提示词通不过,会重写两遍 —— 这很正常。

**阶段 3 —— 门控(第 3–4 周)。** 将评估框架接入 CI 作为警告,而非阻塞。观察两周。通过观察误报率所发现的阈值,才是唯一能存活下来的阈值。只在误报率低于 5% 时才升级为阻塞。

**阶段 4 —— 回放循环(持续)。** 一旦门控可靠地阻塞,就启用生产追踪回放层。这是切片覆盖差距浮现的地方,也是每次事后复盘开始向黄金数据集补回用例的地方。

## 这套体系不能解决什么

三条诚实的局限,与我们在本系列每一篇中的表述一致。

1. **套件漂移是永无止境的工作。** 回归测试是基础设施,不是项目。黄金数据集必须每季度重新分层,评判器必须每周重新校准,阈值预算必须每次事后复盘后重新调优。没有任何版本允许你交付一套套件之后就走人。
2. **完美校准的评判器仍然是一个模型。** 相对于人工评分者 Spearman ρ = 0.74 意味着大约四分之一的评判器调用与人工中位数不一致。这残余的不一致就是每个得分上的噪声地板。我们在每份发布报告中都明确把它呈现出来;忘记它存在的团队迟早会因此感到意外。
3. **闭源 API 后端限制了你能验证的程度。** 使用闭源 API 模型时,回归套件可以测量行为,但无法验证权重溯源。如果你需要完整的可复现性 —— 受监管行业、被审计的部署 —— 这个折中在模型选择上,而不在套件上。

## 下一篇

第 8 篇是本系列的最后一篇,在 CI 内部收尾闭环。如果本文和第 5 篇讲的是门控处运行什么,那么下一篇讲的就是为门控产生候选版本的 CI 层 —— 合并前评估、对提示词模板的契约测试,以及如何在不让预算破产的情况下为 12 分钟评估套件配置 CI 算力规模。这是支撑我们目前所写一切的工程层。

## 常见问题

**LLM 评估与 LLM 回归测试有何区别?**

评估测量模型在某个时间点上、相对于一个绝对评分准则是否达到质量门槛。回归测试测量候选版本是否表现得与冻结的基线一致,按切片、跨多个维度。基线正是它之所以是回归测试的原因 —— Divinci 同时提供两者,而其回归模式会固定 (model_sha, prompt_sha, judge_sha, dataset_sha),这样一个移动的得分就能识别出哪个输入发生了变化。

**黄金数据集应当包含多少用例?**

比你以为的更少,分层得比你以为的更好。我们曾用 200 个用例、5 个定义良好的切片就提供了有用的回归覆盖,也见过 5,000 用例的数据集因为没有分层而错过一切重要的东西。从 200 个开始,做好分层,然后通过事后复盘逐个增长回放桶。

**我应该使用人工评审还是 LLM-as-judge?**

两者都要,由人工来校准评判器。人工跟不上发布周期 CI 门控所需的打分体量。评判器填补体量,人工校准评判器 —— 每周用 Spearman ρ ≥ 0.7 衡量。任何一者单独使用都是一种失败模式。

**如何为非确定性输出做测试?**

对分布而不是字符串打分。使用评判器可以跨多种表达应用的评分准则进行打分,并在 temperature > 0 的条件下对每个输入运行 3 到 5 次,这样切片感知的得分就是一个补全分布上的得分,而不是单一样本。仅对确实需要确定性输出的用例(结构化输出工具调用、分类)收紧温度。

**对第一道 CI 质量门控,我应当优先采用哪些指标?**

任务完成度和一道安全门控。两者都按切片。在前两者校准之前增加更多维度会产生噪声;部署更多维度的团队最终通常以噪声为基础进行门控。在开启检索后再增加忠实度;在前两者稳定后再增加延迟。

## 参考资料

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 April 2026. The named 2026 failure mode for slice-aware regression analysis; aggregate scores hold flat while a low-volume slice silently regresses.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Empirical evidence that strong LLM judges agree with human raters at roughly inter-human-agreement levels (≈ 80%) on open-ended tasks, with reported failure modes that calibrate-against-humans audits are designed to detect.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. The foundational result on catastrophic forgetting in fine-tuned neural networks — why a fine-tuned custom LLM has to be regression-tested for general capability loss, not just gain on the target task.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> The closed-API contrast: gates on infrastructure metrics (latency, errors, CPU) rather than on per-slice semantic quality.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. The rank-correlation coefficient that anchors the slice-aware gate — robust to scoring-scale drift in the judge, which is the property we needed.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> The cross-industry baseline for "how often deploys cause incidents" and "how fast you recover." Regression suites that block at the gate move the first metric down; instant rollback ([post 5](/zh/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) moves the second.
  </li>
</ol>
