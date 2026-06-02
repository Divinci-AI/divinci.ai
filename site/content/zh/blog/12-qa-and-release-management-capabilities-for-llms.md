+++
title = "每个定制 LLM 平台都应交付的 12 项 QA 与发布管理能力"
description = "逐项评估 LLM 发布平台的能力清单:分片感知门控、校准评判器、原子回滚、哈希链回执——哪些已饱和、哪些缺失,以及各阵营如何分化。"
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "在我们自己动手构建之前,我们调研了十二个 LLM 发布平台。市场分裂成三个彼此并不相接的阵营——评估-CI 工具、服务金丝雀工具和可观测性工具——而它们之间缺失的那条接缝,恰恰是一次客户发布所真正需要的。本文是那次调研所沉淀下来的能力清单:12 项可应用于任何平台(包括我们自己)的具体测试。"
+++

*发布周期手记——第三部分*

---

一年前,在我们着手构建自己的发布管道之前,我们坐下来列出了一个严肃的 LLM 平台应当交付的每一项 QA 与发布能力。然后我们对照这份清单评估了另外十二个平台——LangSmith、MLflow、Weights & Biases、Braintrust、Humanloop、Patronus、Arize、Phoenix、Confident、Deepchecks、SageMaker Deployment Guardrails、KServe、BentoCloud、Vertex AI Endpoints、Seldon Core。没有谁交付了全部十二项。那些*已经*交付的组合,聚集成了三个彼此并不相接的阵营。

本文是由此而来、可移植化的能力清单。它按照每项能力所归属的四个管道阶段——**Register → Gate → Roll → Observe**(注册 → 门控 → 滚动 → 观察)——组织,从而能与我们写过的[管道架构](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)以及[失败模式](/zh/blog/10-ci-cd-release-failures-in-custom-language-models/)干净地组合在一起。如果你正在评估工具,就把这份清单从头到尾对每一个候选项过一遍;其中差距最深的几项,会告诉你它属于哪个阵营。

## 三个阵营(让你先知道自己在看什么)

在清单本身之前,先看一下 2026 年的市场轮廓:

- **评估-CI 阵营** —— Braintrust、Humanloop、Patronus。在 PR 合并时运行自动化评估器,拦截不合格的合并。从不触碰线上流量。在能力 4–6 上很强;在 7–12 上缺席。
- **服务金丝雀阵营** —— SageMaker Deployment Guardrails、KServe、Vertex AI Endpoints、BentoCloud、Seldon Core。拆分流量、监控基础设施指标、按 CloudWatch 风格的告警自动回滚。在 1、7、9 上很强;在 8 的质量侧以及 10–12 上缺席。
- **可观测性阵营** —— Arize Phoenix、Confident AI、Deepchecks。观察生产环境、向人发出告警并升级。在 10(监控)上很强,但它们并不*强制执行*任何事——告警不是自动回滚。

这些阵营之间的间隙——介于"通过 CI"与"按质量(而非仅仅延迟)在线上金丝雀打分"之间——是每个人都必须手工去弥合的部分。弥合这道间隙,是本文承重的核心论点。

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="三个 LLM 平台阵营的维恩图。评估-CI 阵营(Braintrust、Humanloop、Patronus)位于左侧,覆盖 PR 合并时的离线评估。服务金丝雀阵营(SageMaker、KServe、Vertex、BentoCloud、Seldon)位于右侧,覆盖按基础设施指标回滚的流量拆分。可观测性阵营(Arize、Phoenix、Confident、Deepchecks)位于底部,覆盖无强制执行的监控与告警。三个圆两两以窄条相交,但三者共同相交的中心区域为空。那个空白的中心正是本文所要讨论的缺失接缝——一项由分片质量驱动、在线上流量上原子化强制执行的发布决策。">
<title>三个阵营与缺失的中心</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">彼此并不相接的三个阵营</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">每个阵营只占据一块。中心是每个团队都要手工去弥合的地方。</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">评估-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust、Humanloop、</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">PR 合并时的</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">离线评估门控</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">服务金丝雀</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker、KServe、</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex、BentoCloud、</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">流量拆分 +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">基础设施指标回滚</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">可观测性</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize、Phoenix、Confident、Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">监控 + 告警(无强制执行)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">缺失的</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">接缝</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">缺失的接缝:分片质量门控 → 由输出质量(而非基础设施指标)驱动的原子回滚。</p>

## 阶段 ① —— Register(注册)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">不可变的清单层。按 SHA 进行故障归因。</span>
  </div>
</div>

### 能力 1. 带内容寻址 SHA 的不可变发布清单

它是什么:一次发布并不是一个模型权重文件。一次发布是一个不可变的*一切*的捆绑包——模型工件、提示词模板、路由规则、数据集版本、预处理版本——由一个单一的 SHA-256 来寻址。两个部署"同一次发布"的人必须产生相同的 SHA,否则管道会拒绝。

为什么重要:没有这一项,当状态被分散在三个系统中时,"哪个改动弄坏了生产环境?"是无解的。Atlassian 2022 年 4 月的事故<sup><a href="#ref-1">[1]</a></sup>恢复每个站点都花了十二个小时,原因正是状态分散在各自独立版本化的系统中,必须再被协调回到一致。

谁交付了:服务金丝雀阵营部分交付(模型 + 路由);模型注册中心(MLflow、W&B Models<sup><a href="#ref-2">[2]</a></sup>)部分交付(仅模型工件)。几乎没人把**提示词模板**也捆进 SHA,而提示词恰恰是变化最频繁的那个字段。

### 能力 2. 跨全部发布组件的原子版本控制

它是什么:从发布 A 切换到发布 B 在一条指令中翻转*一切*——权重、提示词、路由、数据集和预处理——而不是五次独立的仪表盘编辑。

为什么重要:部分切换会制造出未定义行为窗口。如果提示词更新了,但路由规则还没,那么每一个用新提示词配上旧路由类的请求,都处在一种没人计划过的状态。

谁交付了:没有人完全做到。服务金丝雀阵营原子化地切换模型镜像;提示词和路由通常在别处。基于清单的切换,正是 Divinci 原子回滚论断<sup><a href="#ref-5">[5]</a></sup>的来源。

### 能力 3. 训练-服务环境一致性

它是什么:门控评估期间所用的预处理管道,与生产服务器所用的预处理是*同一个*。如果它们分叉了,那么每一个离线数字都是谎言。

为什么重要:训练-服务偏差是我们写过的[十种发布失败](/zh/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew)之一。症状是"在评估中表现正常,在生产中像换了一个模型"。解药是把预处理也注册进清单里,并按生产环境的预处理版本进行门控。

谁交付了:容器化框架(BentoML、KServe)因把预处理与服务部署在一起而获得部分认可。它们之中没有谁把预处理绑定到评估门控的输入上。

## 阶段 ② —— Gate(门控)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">分片级 Spearman ρ 与以人工为锚的评判器之间的相关性。</span>
  </div>
</div>

### 能力 4. 分片级 / 领域级质量门控

它是什么:门控决策消费*分片级*分数——合同起草、法条释义、知识产权许可——而不是一个单一的聚合值。任何一个分片低于其阈值,都会把这次发布标记为 `gate_fail`,不管平均值看上去多么漂亮。

为什么重要:聚合分数会冲掉局部回归。Tianpan 的*Semver Lie*一文<sup><a href="#ref-3">[3]</a></sup>把这一点定为 2026 年最主流的 LLM 发布失败模式:模型在平均值上有所提升,却在某一类用户旅程上悄悄崩塌。

谁交付了:**2026 年,别无他家**。评估-CI 工具——Braintrust、Humanloop、Patronus——基于单一全局评分准则或扁平任务列表打分。它们既不暴露分片级阈值,也不暴露针对分片的盲值覆盖。这是阵营之间第一次失之交臂的地方。

### 能力 5. 以人工为锚的校准评判器(Spearman ρ 对照人工评分)

它是什么:这里的评判器不是一个通用的 LLM-as-judge。它是一个针对每个分片,都已度量并配置好其 Spearman ρ(对照领域专家评审组)的 LLM 评判器。选用它,是因为它的排序与人类的排序相一致,而不是因为它名声响亮。

为什么重要:MT-Bench<sup><a href="#ref-6">[6]</a></sup>表明,GPT-4 作为评判器与人类的整体一致性超过 80%,但按类别看方差很大,从代码(86%)一路到写作(36–44%)。"整体一致性"会掩盖那些评判器并不可靠的分片。按分片校准评判器,是让自动打分变得可信的唯一诚实办法。

谁交付了:Braintrust、Humanloop、Patronus 都跑评判器评估。它们当中没有任何一个要求、暴露或持久化按分片、以人工为锚的 Spearman 校准。Divinci 的校准管道在[校准 AI 评判器](/zh/blog/calibrating-the-ai-judge/)一文中有所记录。

### 能力 6. 必填书面理由的覆盖路径

它是什么:强制覆盖一次门控失败是允许的(冷启动、已被接受的回归等),但需要两个字段——`forceGateOverride: true` 以及 `overrideReason: "..."`。理由与用户 ID 一起进入审计轨迹。不允许匿名覆盖。

为什么重要:治理性的门控并不是一个独立的合规功能;它是门控阶段自身的一项属性。审计轨迹不仅要回答"这次覆盖是否被用过?",还要回答"当时的理由是什么?"——因为未来的你需要去读它。

谁交付了:评估-CI 工具有相应的开关;但它们当中没有谁把理由作为覆盖的一项结构性要求。

## 阶段 ③ —— Roll(滚动)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">5% → 25% → 100% 的金丝雀,每一步都带质量监视器。</span>
  </div>
</div>

### 能力 7. 带停留时间的多检查点金丝雀

它是什么:流量从 0% 经由至少三个检查点——通常是 **5% → 25% → 100%**——抵达生产,并在每一个检查点上以配置的停留时间或配置的请求数(以两者之中*更晚*的为准)进行驻留。不允许从 0% 直接到 100%。

为什么重要:长尾 bug 只有在规模上才会浮现。一个影响 0.3% 对话的 bug,在 100 条提示词的评估里不可见,但在生产流量的 5% 上就显而易见。停留时间正是给金丝雀以足够的时间去看到长尾。

谁交付了:服务金丝雀阵营交付了这一项。AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup>记录了 `TerminationWaitInSeconds` 默认值为 600(十分钟)。KServe、BentoCloud、Seldon 与 Vertex 也都暴露出类似的多步金丝雀配置。这是已饱和的那一项能力。

### 能力 8. 在每个金丝雀检查点上的输出质量监视器

它是什么:在每个检查点上,管道在推进之前会检查三个监视器——p95 延迟、5xx 比率,**以及**由能力 5 中那个同一个校准评判器计算出的输出质量分。仅有延迟和 5xx 是不够的。

为什么重要:这就是各阵营再次失之交臂的地方。SageMaker、KServe、Vertex、BentoCloud、Seldon 都监控延迟和错误率。但它们之中没有谁交付了检查点级的输出质量监视器——因为它们没有一个可以拿来打分的校准评判器。评估-CI 工具有评判器,但它们并不坐在线上流量上。

谁交付了:没有谁把这座桥架完。带停留的金丝雀基础设施存在于服务阵营;校准评判器存在于评估-CI 阵营;我们没见过谁把二者连起来。

### 能力 9. 在质量被破坏时自动停止

它是什么:一个在输出质量上失败的金丝雀检查点会自动停止。推进不会继续。不需要呼叫人来停止这次发布。

为什么重要:在发布滚动的时间尺度上,人并不在回路里。等到客户工单到达时,25% 的检查点已经过去,100% 的推进也已经完成。

谁交付了:服务金丝雀阵营在基础设施指标上做停止。质量指标上的停止是需要能力 8 存在才有的部分。

## 阶段 ④ —— Observe(观察)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">持续的轨迹回放 → 约 12 秒内完成原子回滚。</span>
  </div>
</div>

### 能力 10. 持续地把生产轨迹回放至候选发布

它是什么:在金丝雀推进到 100% 之后,观察器持续运行。它对近期的生产轨迹进行采样,把它们回放至*候选*(现行)发布,用校准评判器打分,并按分钟级别给出质量分数。是持续的,不是周期性的。

为什么重要:静默的质量下降——模型回避、自信地把日期幻觉出来、在不该拒绝的地方拒绝——既不会动延迟,也不会动 5xx。你能拿到的唯一信号是客户工单,而那是最糟糕的信号。一个持续的质量监视器能在个位数分钟内捕获它们。

谁交付了:**没人**。可观测性阵营(Arize、Phoenix、Confident、Deepchecks<sup><a href="#ref-7">[7]</a></sup>)监控生产输出,但不强制执行。服务金丝雀阵营盯基础设施。评估-CI 阵营不坐在流量上。闭环——生产轨迹 → 校准评判器 → 强制执行——就是那条缺失的接缝。

### 能力 11. 秒级而非分钟级的原子回滚

它是什么:当观察器触发(比如连续三分钟低于阈值)时,回滚自动触发。回滚把路由重新指回清单中的 `previous_release`。因为上一个发布本身就是一个完整捆绑的清单,每一个组件都会原子化地翻转。在大约 100 个副本的服务上,包含在飞请求 drain 在内的端到端耗时:大约 12 秒<sup><a href="#ref-5">[5]</a></sup>。

为什么重要:Cloudflare 2022 年 6 月的事故<sup><a href="#ref-8">[8]</a></sup>花了 44 分钟才回滚完成。原因并不在回滚本身——而在于工程师互相踩到对方的回滚上,因为状态是被拆开的。基于清单的回滚是单条指令的;它不可能出现那种失败模式。

谁交付了:服务金丝雀阵营交付了快速的基础设施回滚(由告警触发、蓝绿翻转)。架构上的区别在于*触发器*是仅基础设施的,还是质量感知的(能力 10)。

### 能力 12. 哈希链、可外部锚定的合规回执

它是什么:每一次发布决策——注册、门控通过、门控失败、门控覆盖、检查点推进、自动回滚——都发出一份带 SHA-256 的 JSON 回执,并通过哈希链链接到该客户的上一份回执以及该发布的上一份回执。这条链按客户配置的时间表在外部进行锚定。

**开源权重附注。** 当发布以开源权重模型(Gemma、Qwen、Llama、Mistral、GPT-OSS)为支撑时,回执中嵌入一份[vIndex 权重证明](/zh/compliance/)——一份关于"在决策时刻处于活跃状态的权重就是清单所注册的那份权重"的证明。当发布以闭源 API 模型(OpenAI、Anthropic、Google 等通过不透明 API 提供的)为支撑时,回执覆盖决策链,但无法主张权重来源,因为提供方不暴露权重。回执对此明示说明。这是可验证性的边界。

为什么重要:受监管行业今天拿到的是*日志*。EU AI Act 与 NIST AI RMF<sup><a href="#ref-9">[9]</a></sup>则越来越多地要求*证明*。一份哈希链回执,是"我们有日志"与"审计员无需信任我们的日志,就能验证这条链"之间的区别。

谁交付了:别无他家。这正是 Divinci 现有[合规页面](/zh/compliance/)所直接对应的差异化部分——同一种回执格式,扩展到了发布决策上。

## 12 项能力,按平台阵营划分

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="12 项能力按平台阵营的矩阵。Divinci 全部 12 项都有。评估-CI 阵营(Braintrust、Humanloop、Patronus)拥有 5 和 6。服务金丝雀阵营(SageMaker、KServe、BentoCloud、Vertex、Seldon)在基础设施指标层面拥有 1 部分、2 部分、7、9 和 11。模型注册阵营(W&B Models、MLflow、LangSmith)拥有 1 部分和 2 部分。可观测性阵营(Arize、Phoenix、Confident、Deepchecks)以仅监控形式拥有 10。其他人均不具备 4 分片门控、5 以人工为锚的校准评判器、8 输出质量金丝雀监视器、10 带强制执行的闭环轨迹回放,或 12 哈希链回执。">
<title>12 项能力,按阵营划分</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">哪个阵营交付哪项能力</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = 已交付。◐ = 部分交付(仅基础设施,或仅注册中心)。✗ = 未交付。有六项能力在其他每一个阵营中都缺失。</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">能力</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">评估-CI</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">服务</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">注册中心</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">可观测</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. 不可变清单 SHA</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. 原子版本切换(全组件)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. 训练-服务环境一致性</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. 分片 / 领域级质量门控</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. 以人工为锚的校准评判器</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. 必填理由的覆盖路径</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. 带停留的多检查点金丝雀</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. 每检查点的输出质量监视器</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. 质量被破坏时自动停止</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. 闭环生产轨迹回放</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. 秒级原子回滚</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. 哈希链合规回执</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">能力 4、5、8、10、12 已被突出显示:这五项在此次扫描中没有任何其他家交付。其余的则聚集在某一阵营或另一阵营。</text>
</svg>
</figure>

模式本身就是要点。五项能力——**分片门控、校准评判器、质量金丝雀监视器、闭环回放、哈希链回执**——在其他每一个阵营都显示为 ✗。这就是那条接缝。其余七项能力分散到各个阵营,以使得每个阵营都内部自洽,但彼此互不完整。

## 对于定制语言模型而言,QA 与软件 QA 有何不同?

LLM 并非确定性的,即便在温度为零时也如此——批处理与硬件差异会导致输出变化。这一个属性就足以打破传统 QA 所依赖的大多数假设:

- **你无法写下 `expect(output).toEqual(X)` 这样的断言。** 你需要一种分布感知的评估,它消费的是与以人工为锚的评分员之间的秩相关性,而不是与一份固定夹具的相等性。这就是能力 5。
- **一个模型可以通过聚合质量检查,却在某一分片上失败。** 这正是能力 4 单独存在的原因。如果你的评估不能切片,它就抓不住分片感知的回归。
- **质量失败在基础设施层是静默的。** 当模型回避或幻觉时,延迟和 5xx 仍然干干净净。能力 8 与 10 之所以存在,正是因为基础设施侧的任何监视器都看不到这些。
- **回滚不是可选项。** 因为失败模式是概率性的,且其中一些是静默的,回滚路径必须是主基础设施,而不是备选方案。能力 11 让"12 秒"成为可能;能力 2 让它正确。

一个不承认这四个事实的 QA 与发布平台,所交付的就是贴上 LLM 标志的确定性软件 CI/CD。市场上这么做的玩家很多。

## 在实践中,审计轨迹如何支撑 AI 合规?

我们最常见的合规缺口——当审计员在部署六个月后到来,问"3 月 15 日运行的是哪个版本的模型?那次发布是谁批准的?"——并不是"我们没有日志"。而是"我们在五个系统里都有日志,但它们的时间线对不上"。

合规回执(能力 12)通过让日志本身成为一个可移植的工件来解决这一问题:哈希链、单一源、可外部锚定。审计员无需信任我们的基础设施,就能验证这条链。这正是"我们有记录"与"这些记录是可证明的"之间的区别。

对于以开源权重模型为支撑的发布,回执还包括一份权重证明——一份关于"活跃的权重就是清单所注册的那份权重"的密码学证明。这就满足了更难的那些要求(GDPR 第 17 条删除权、EU AI Act 来源要求),因为你能证明的*不只是已部署的是什么*,而且*底层权重确实就是它所宣称的那份权重*。

对于闭源 API 支撑的发布——当模型被部署在不透明的 API 之后、权重并不暴露时——回执覆盖决策链,但无法主张权重来源。我们在回执中明确地这样写,而不是暗示一份我们交付不了的证明。这就是当提供方把权重保留在内部时,可验证性的边界。

## 这份清单不解决什么

三个诚实的局限:

**能力并不是为了打勾而打勾。** 一个把全部十二项都做得很差的平台,比一个把其中八项做得很好的平台更糟。这份清单是评估的起点,而不是用于供应商招标的计分卡。

**这份竞争快照属于 2026 年,而且会变。** 六个月后,上面的某些 ✗ 会翻转——竞争对手会读事故复盘并补上缺口。如果你在 2027 年读到本文,请自己再核对一遍这些标记。

**有些能力依赖于其他能力。** 能力 8(输出质量金丝雀监视器)需要能力 5(校准评判器)。能力 10(闭环轨迹回放)二者皆需。一个交付了 8 却没有 5 的平台,交付的就是一个安慰剂——金丝雀监视器存在,但并没有锚定在任何可信赖的东西之上。

## FAQ

### 对定制 LLM 发布而言,最重要的 QA 能力是什么?

分片级质量门控(能力 4)——也就是说,发布决策消费的是各领域对照以人工为锚评分员的 Spearman 分数,而不是单一全局聚合。聚合分数会冲掉局部回归,而局部回归正是 2026 年 LLM 发布最主流的失败模式<sup><a href="#ref-3">[3]</a></sup>。如果你只能从这份清单里交付一项能力,就交付 4。然后再交付 5,后者正是让 4 变得可信的那一项。

### 不在 LLM QA 平台上跑半年,如何评估它?

把上述 12 项能力清单应用到供应商文档上,并附带两项具体测试。第一,要求供应商展示其某一个参考客户的*分片级*门控输出——如果他们只有聚合分数,那他们就没有能力 4。第二,问他们的自动回滚由什么触发——如果答案是"延迟、错误率和我们的告警",那他们就在服务金丝雀阵营,缺失能力 10。

### 评估-CI 工具与发布管理工具之间有什么区别?

评估-CI 工具(Braintrust、Humanloop、Patronus)在 PR 合并时运行自动化评估器,拦截不合格的合并。它们从不触碰线上流量。发布管理工具(本品类)拥有发布清单、金丝雀、观察器与回滚路径。评估-CI 是发布管理工作流的*一部分*,但不能替代它。许多团队只交付了二者之一,然后在某个通过了 CI 的回归静默地命中生产时,才发现这个缺口。

### 回滚应该多快?

数量级是秒,而不是分钟。Divinci 管道上的平均回滚时间约 12 秒——这是大约 100 个副本的服务上在飞请求的 drain 时间,而不是清单切换本身,后者是亚秒级的。对比一下 Cloudflare 2022 年 6 月的事故<sup><a href="#ref-8">[8]</a></sup>,因为状态被拆散在多个系统中,回滚花了 44 分钟。让"秒级而非分钟级"成为可能的架构决策,是捆绑式的发布清单(能力 1 与 2)。

### 为什么合规回执比合规日志更重要?

日志是你自己写的。回执是审计员无需信任你就能验证的。EU AI Act 与 NIST AI RMF<sup><a href="#ref-9">[9]</a></sup>越来越多地区分二者——"有据可查"并不等同于"可被证明",而监管的方向是后者。哈希链、可外部锚定的回执,是跨过这条线的最简单的可用技术。

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Cited for capability 1 — what state-spread-across-systems looks like at scale.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> and <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. The model-artifact-only side of capability 1. Neither ships prompt-template registration.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). Names the slice-aware regression failure mode as the dominant 2026 pattern. Companion: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Anchor for capability 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> and <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> of 600 (ten minutes), maximum 1800 (thirty minutes). The standard infrastructure-metric canary the post contrasts against on capabilities 8 and 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — atomic routing-flip via release manifest.</strong> The ~12-second rollback time is in-flight drain on a ~100-replica service; the manifest swap itself is sub-second. Number is from our own service, not a benchmark. The architecture that makes it possible is the bundled manifest from capability 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) to writing (36–44%). Anchor for capability 5 — why a calibrated judge has to be per-slice.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Observability camp comparison.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Confident AI's 2026 observability tools comparison</a>. All ship monitoring and alerting; none enforce rollback. Anchor for capability 10's "monitor without enforcement" framing.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." 44 minutes from "we know what to revert" to revert complete, in part because engineers walked over each other's reverts. Anchor for capability 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — the four core functions that capability 12 maps onto. Plus the EU AI Act provenance requirements at <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Anchor for capability 12.
</li>
</ol>

---

*本系列下一篇:* **在受监管领域中验证与发布定制 LM。** 上面的能力清单是通用的。下一篇是具体的:EU AI Act、GDPR 第 17 条、HIPAA 与 NIST AI RMF——每一项对发布流程的要求,上面的哪些能力覆盖了哪些要求,以及开源权重 / 闭源权重的分野在哪里真正改变了合规的故事。
