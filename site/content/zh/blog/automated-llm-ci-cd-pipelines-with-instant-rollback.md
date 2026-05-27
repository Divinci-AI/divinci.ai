+++
title = "自动化 LLM CI/CD 流水线与即时回滚"
description = "四阶段发布流水线下的运维层 —— 哪些决策自动触发、哪些需要人工介入、真实的回滚演练是什么样子,以及最终输出的 MTTR 数值。"
date = 2026-05-30T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "CI/CD", "Automation", "Rollback", "MTTR", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-llm-ci-cd-pipelines-with-instant-rollback-veo31.webm"
hero_video_poster = "/images/automated-llm-ci-cd-pipelines-with-instant-rollback-hero-poster.webp"
reading_time = 11
summary = "在人工审批关卡之间,LLM 发布流水线要么能自主运行,要么不能。本文是架构篇的运维伴生篇 —— 它描绘自动化光谱(哪些决策自动触发、哪些需要人工介入、哪些会硬性停止直至有人签署覆盖),展示真实回滚演练的样貌,并以最终输出的 MTTR 数值收尾。"
+++

*发布周期笔记 —— 第五篇*

---

上个季度,被引用最多的页面是那个未真正发出的页面 —— 观察器(observer)在凌晨 2:14 自行触发了它。候选发布通过了关卡,在 5% 流量下停留满规定的四分钟,推进到 25%,然后停在那里。每分钟运行的质量监控在法律领域切片上连续三次读到低于阈值的分数,中止了灰度发布,并将路由重新指回上一个版本。等到 on-call 工程师收到通知时 —— 那是回执通知,不是事故通知 —— 生产流量已经回到已知健康版本上九分钟了。

谁都不需要做什么。[本系列第一篇](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)的架构介绍说明了四个阶段分别是什么。本文讲的是人工审批之间运行的东西 —— 架构之下的自动化层,流水线要么自动做正确的事、要么做不到的边界。

核心主张:**大多数流水线决策应当自动化,但并非全部**。边界很关键。把一切都自动化的流水线终将放行一个本该被人工拦截的发布;什么都不自动化的流水线则毫无意义。把边界划在正确的位置 —— 这就是本文要谈的。

## 自动化光谱

每一个流水线决策都位于一条光谱上,从*"自动触发、不发任何人工通知"*到*"未经明确签字批准就拒绝继续"*。下图展示了在我们已上线的流水线中,各承重决策点在该光谱上的位置。

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="自动化光谱。从左侧的完全自动化到右侧的始终需要人工批准。所标决策点:在完全自动化端,每分钟质量评估、灰度检查点健康检查、自动回滚触发;在中段,关卡通过推进、灰度检查点推进;偏人工端,生产部署登记和清单提交;在始终人工端,关卡失败覆盖决策和冷启动发布影子部署。">
<title>自动化光谱</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">自动化光谱</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">各承重流水线决策的位置,从完全自主(左)到始终人工(右)。</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">完全自动化</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">自行触发,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">不发通知</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">仅通知</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">自动运行;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">回执 + 触达</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">无异常即推进</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">人工可在已知窗口</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">内否决</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">人工启动</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">需要明确</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">用户操作</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">始终人工</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">未提供签字理由</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">即拒绝</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">观察器每分钟</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">质量评估</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">在 5% 调用链样本上</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">持续运行</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">灰度检查点</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">健康检查</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">5/25/100 阶段的</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + 输出质量</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">自动回滚</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">触发</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">连续 3 分钟</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">低于阈值</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">关卡通过推进</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">至灰度</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">所有切片 ≥ 阈值</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ 自动从 5% 开始</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">检查点</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">驻留期监控保持稳定</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">则推进</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">发布</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">登记</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">客户提交</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">新清单</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">关卡失败覆盖</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">需在审计日志中</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">提供书面理由</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">红色标记</tspan> = 流水线行为不对称的两个决策点:自动回滚自行触发,你无法选择不参与;关卡失败覆盖在缺少理由时拒绝继续,你无法选择跳过填写。</text>
</svg>
</figure>

上图中有两个标记是红色,而不是按其所在区域着色。它们是不对称决策 —— 是流水线对"谁有权决定什么"持有强硬立场的两处。**自动回滚触发**不询问即触发;你无法关闭它,因为它存在的全部意义就是要在凌晨 2:14 工作。**关卡失败覆盖**在没有书面理由时拒绝推进;你同样无法关闭这一点,因为它存在的全部意义就是让未来的你能读到当时的原因。流水线其余大部分都可配置;这两处不可配置。

## 自动回滚到底是怎么触发的

关于自动回滚最常被问的问题是*"靠什么阻止它因错误原因触发?"*。诚实的答案是:没有任何单一机制。保护来自触发器的接线方式。

观察(Observe)阶段运行一个每分钟一次的评分循环。每分钟它会:

1. 从当前激活的发布中抽取一小批近期生产调用链。
2. 在*活跃模型*上回放每条链(不是候选模型 —— 我们在评分实际服务的内容)。
3. 使用驱动 Gate-2<sup><a href="#ref-1">[1]</a></sup> 的同一个经过人工锚定校准的评判器对每次回放打分。
4. 在样本上计算一个单一的输出质量分,写入 `CanaryHealthSample`。

当**连续三次每分钟样本**低于回滚阈值时(默认值:关卡阈值的 0.85 —— 如果关卡是 0.65,则回滚阈值是 0.55),回滚触发。不是一分钟差,而是三分钟。三分钟锁定期是噪声过滤器 —— 单次异常读数不会触发任何动作,但持续的回归会。

锁定期一旦触发,回滚 worker 即执行:

```bash
# 实际执行 —— 流水线自行运行此命令。无需人工确认。
POST /api/v1/releases/<previous_release_sha>/activate
# 响应 <1s;在约 100 副本服务上,正在处理的请求排空约 12s
```

回执触发。on-call 工程师在 Slack 收到通知 *是回执通知*,不是事故通知。他们打开回执;看到三次低于阈值的读数、已用时间,以及 `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup> 哈希。十二秒是正在处理请求的排空时间;切换本身是亚秒级的。等到工程师清醒到能问"我需要做什么吗?"时,答案是"不用,但你仍应该看看关卡为什么放行了它"。

## 真实的自动回滚回执

这是回执在生产环境中的样子。与[合规页面](/zh/compliance/)记载的相同哈希链格式,外加自动回滚事件特有的字段:

```json
{
  "kind": "auto_rollback",
  "release_id": "rel_a01c66",
  "previous_release_id": "rel_8f72b1",
  "trigger_at": "2026-05-29T02:14:23Z",
  "completed_at": "2026-05-29T02:14:35Z",
  "elapsed_seconds": 12,
  "trigger_reason": "observer_quality_threshold_breach",
  "observer_readings": [
    { "minute_at": "2026-05-29T02:11:00Z", "quality_score": 0.523, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:12:00Z", "quality_score": 0.508, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:13:00Z", "quality_score": 0.491, "below_threshold": true,  "slice": "legal-IP-licensing" }
  ],
  "rollback_threshold": 0.55,
  "active_manifest_sha256_before": "9abaeaf6c91f8b...",
  "active_manifest_sha256_after":  "8f72b1de4a93c5...",
  "audit_chain_signature": "sha256(...)",
  "notified_users": ["oncall@customer.example"],
  "notification_sent_at": "2026-05-29T02:14:36Z"
}
```

回执本身就是 on-call 的第一接触点。读它就能回答一个半睡半醒的工程师真正会问的问题:是什么触发的、哪个切片失败了、差了多少、切换花了多久、当前在跑什么。从这里出发的下一步动作通常是*"去看看关卡当初为什么放行了它"* —— 而失败发布的回执已经带有按切片的 Spearman 表。

## 流水线**不会**自动做的事

"自动回滚不询问即触发"的另一面是:有些其他事情主动地无法自动发生。三条明确的拒绝。

**它不会在没有签字覆盖的情况下推进一个关卡失败的发布。** 关卡失败会将发布标记为 `gate_fail`;`/activate` 端点拒绝接受该清单 SHA;没有任何命令行咒语能绕过这一点。唯一的前进路径是带 `forceGateOverride: true` 以及 `overrideReason: "<自由文本>"` 的强制覆盖。理由字段是必填的、自由文本,并随用户 ID 一同进入审计日志。我们这样设计是为了让未来的你能读懂当时的你为何认为切片回归可以接受。野外环境里有三个人走过覆盖路径。他们的理由仍在审计日志里。

**它不会在任何监控指标恶化时从灰度推进到 100%。** 如果在某个检查点的驻留期结束时,p95 延迟、5xx 率或输出质量分中的任何一项在区间之外,流水线会在该检查点停下并发通知。它不会先推进再事后道歉。

**它不会自动给冷启动发布做灰度。** 一个没有任何生产流量历史的发布 —— 比如针对全新数据集的新一轮微调 —— 其输出质量无从对比。流水线拒绝对冷启动发布启动灰度。我们要求先做 24 小时的影子部署,即对真实生产调用链进行观察、但不对外返回它的响应。24 小时后我们有了质量基线;然后灰度才能开始。更慢;诚实;不可配置。

## 端到端恢复有多快?

我们对外公布的恢复时间数字是 **12 秒**。这是在约 100 副本服务上的正在处理请求的排空时间。清单切换本身是亚秒级的。要让这 12 秒对读者有用,需要拆开来看:

- **回滚前 0–60 秒:** 三次连续低于阈值的读数陆续到达。首次低于阈值的读数启动锁定计时器;只要质量仍低于阈值,后续每分钟都会延长锁定。
- **t = 0:** 第三次低于阈值的读数写入 `CanaryHealthSample`。回滚 worker 观察到第三击并分派 `/activate previous_release`。
- **t < 1 秒:** 路由层的活跃发布指针(在 Redis 中)翻转。新请求开始命中上一个发布。
- **t = 1 到约 12 秒:** 候选发布继续为切换发生时已经在处理的请求服务。正在处理请求的排空。一些流式响应需要 8–10 秒才能自然完成,所以在典型服务上清理尾迹大约 12 秒。
- **t ≈ 13 秒:** 审计日志回执被写入并签名。通知发出。

与我们一直引用作为锚点的公开事后分析相比:Cloudflare 2022 年 6 月的故障<sup><a href="#ref-3">[3]</a></sup> 从"我们知道要回退什么"到"回退完成"花了 44 分钟 —— 而且那是*基础设施*层。Atlassian 2022 年 4 月的故障<sup><a href="#ref-4">[4]</a></sup> 每个站点要 12 小时,因为状态分散在多个系统中。DORA<sup><a href="#ref-5">[5]</a></sup> 对"精英表现"在失败部署恢复上的阈值是一小时以内。十二秒不是比精英阈值好一个数量级 —— 而是好三个数量级。让这成为可能的架构决策,是来自[第一阶段](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register)的捆绑式发布清单。没有清单,你就没有一个可供路由重指向的单一对象。

## 回滚演练 —— 没人喜欢、也没人做的无聊功课

这是大多数团队跳过的部分:**唯一能可靠证明你的回滚路径可用的信号,就是你做了一次有计划、按时安排的演练并确认了。** 我们每个季度做一次。流程是:

1. 选一个工作日工作时间内的、随机安排的时段。告诉团队会有,但不告诉具体小时。
2. 在灰度切片上注入一次合成质量回归。(我们有个测试模式标志,可以让候选模型对一个魔法 header 用"我拒绝回答"应答 —— 必定被校准评判器判负。)
3. 把测试发布推过关卡(它会通过 —— 我们测的是回滚,不是关卡)。启动灰度。
4. 观察器看到三次低于阈值的读数。自动回滚触发。
5. 等 on-call 工程师反应。计他们花了多久。注意他们是否信任回执到不再 page 升级到告警状态。
6. 验证审计日志在回滚回执中显示测试模式标志,这样未来审计能区分演练与真实事故。

我们做的第一次演练端到端用了 19 秒(12 秒切换 + 一个 7 秒的稳定延迟,后来修掉了)。最近一次演练 —— 2026 年 Q1 —— 用了 12 秒。这项演练永远不被允许跳过。每季度;每个客户集群。

大多数团队从未做过一次有意安排的回滚演练。他们回滚路径的第一次运行就发生在真实事故中,有压力,且多人在通话里。演练才是让 12 秒成为真实数字、而不是理想数字的关键。

## 本方案未解决的问题

三个诚实的局限:

**自动回滚可能来回乒乓。** 如果候选发布*和*上一个发布都不好 —— 比如上一个发布本身就有一处缓慢发展的切片回归没人察觉 —— 流水线可以回滚,然后上一个发布在回滚后的观察中也失败,并且没有第三个发布可回滚到。流水线会把流量停到维护页,而不是来回抖动。修复办法是在清单链中保留多于一个的历史健康发布,让回滚目标可配置。

**观察器会增加推理成本。** 在 5% 样本上把生产调用链重新过一遍活跃模型,会让推理花费多大约 5%。我们认为这个取舍是对的。一些客户认为在低利润负载上这太贵,想把采样率调低。这个旋钮存在。

**坏的评判器比没有评判器更糟。** 如果驱动观察器的校准评判器本身没校准 —— 已经从人工锚点漂移了,或在过时语料上训练 —— 观察器可能因错误的原因触发自动回滚。重新校准的节奏很重要。校准评判器篇<sup><a href="#ref-6">[6]</a></sup>记录了流程;运维要求是你真的去执行它。

## 常见问题

### 为什么回滚触发要求连续三分钟而不是一分钟?

因为 LLM 质量分有噪声地板 —— 单次异常的分钟级读数可能来自采样偶然性(5% 调用链样本恰好落在一个困难切片上),而不是真正的回归。三分钟锁定是最省的噪声过滤,同时仍能把总反应时间控制在一分半以内。我们两个方向都调过;在我们客户的典型流量形态下,三是甜点。如果你的流量形态不同,驻留期可以按发布配置。

### 自动回滚应当可配置为"关闭"吗?

在我们已上线的流水线中,不。设置自动安全机制的意义就在于它能在凌晨 2:14、没人盯着时工作。一个可关闭的自动回滚是一张"我们曾经有过安全网"的便利贴。把它做成可配置的论据是某些工作负载利害太低,不值得任何误触发回滚。我们认为这个论据导向错误的地方 —— 如果你的工作负载利害低到不需要自动回滚,那你也不需要发布流水线。

### 上一个发布也不好的情况怎么处理?

回滚目标默认是 `previous_release`,但清单链存储的历史不止 N-1。运维人员可以将回滚重新指向任意历史上健康的清单 SHA —— `/api/v1/releases/<historically_good_sha>/activate` —— 这就是当 N-1 自动回滚撞上更早的坏发布时的人工干预路径。逃生阀就在那儿。这种情况很少见。

### 该优化的正确指标是 MTTR 还是 MTBF?

MTTR —— 平均恢复时间 —— 远远更重要,至少对 LLM 系统是。MTBF(平均故障间隔)假设了一个"故障"的确定性概念,而 LLM 工作负载没有。输出质量持续漂移;"故障"是阈值判断。优化快速恢复对你在哪儿划线是鲁棒的;优化"永不故障"则脆弱而虚假。DORA 的精英阈值<sup><a href="#ref-5">[5]</a></sup>本身就以 MTTR 框定,这才是正确的框定方式。

### 你们真的做回滚演练吗?

是的 —— 每季度、有计划地、回执里带测试模式标志,这样审计日志可以区分演练与真实事故。我们做的第一次演练暴露了一个我们没意识到的 7 秒稳定延迟。演练是知道路径真的可用的唯一方法;读 runbook 是不够的。大多数团队从未做过,这就是为什么大多数团队的 MTTR 数字是理想数字而非实测数字。

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge calibration.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). The anchor for why a calibrated judge is necessary and why per-slice agreement matters more than aggregate agreement. The observer's per-minute scoring loop depends on this.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vindex weight-attestation.</strong> Documented on the <a href="/zh/compliance/">Divinci compliance page</a> and walked through in the <a href="/zh/blog/validating-and-releasing-custom-lms-in-regulated-fields/">regulated-fields post</a>. The `vindex_sha256_before/after` fields in the auto-rollback receipt are the cryptographic anchor an auditor can verify without trusting our logs.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Forty-four minutes to revert at the infrastructure tier, in part because engineers walked over each other's reverts. Anchor for the "manifest-driven swap can't have that failure mode" claim.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian April 2022 outage.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 hours per site to restore, 14 days total for 883 sites, because state was split across independently-versioned systems. Anchor for the "bundled release manifest is the thing that makes seconds-not-hours possible" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>DORA failed-deployment recovery threshold.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. The "failed deployment recovery time" elite-performer threshold is documented as under one hour. The 12-second pipeline number is three orders of magnitude below the elite threshold, which is the right way to read the comparison.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrating the AI judge.</strong> Our companion post <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. The procedure for keeping the human-anchored judge in calibration over time. The operational claim in this post — that auto-rollback only works as well as the judge driving it — only holds if the judge is in fact periodically recalibrated.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — Divinci pipeline reference.</strong> The architecture this automation layer sits under: the <a href="/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">four-stage pipeline post</a>. The full API surface is documented at the <a href="/zh/api/">API reference</a>; the release-management section is the one this post is talking about.
</li>
</ol>

---

*本系列下一篇:* **2026 年自定义语言模型的 CI 测试。** 本文谈的是人工审批之间的运维层。下一篇谈的是流水线开始*之前*的那一层 —— 合并前 CI:PR 阶段该评估什么、在关卡看到之前实际能捕获到哪些类型的回归、以及哪些类型无法捕获。
