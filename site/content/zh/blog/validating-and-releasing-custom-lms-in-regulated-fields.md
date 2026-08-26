+++
title = "在受监管领域验证并发布自定义语言模型"
description = "欧盟 AI 法案、GDPR 第 17 条、HIPAA、NIST AI RMF —— 按能力逐项映射到自定义 LLM 发布流水线。开放权重 / 封闭 API 的分界,正是合规叙事真正分岔的地方。"
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vIndex"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "受监管行业对自定义语言模型的合规性,沿着一条清晰的分界线分裂:开放权重 vs 封闭 API。对开放权重底座,你可以交付一份 vIndex 权重证明,以加密方式满足 GDPR 第 17 条的可验证删除要求。对封闭 API 底座,同一份回执覆盖了决策链,但无法主张权重来源 —— 而监管机构会在回执本身看到这个区别。本文将四个监管框架(欧盟 AI 法案、GDPR、HIPAA、NIST AI RMF)映射到我们交付的四个流水线阶段,并展示真实的回执格式。"
+++

*发布周期笔记 —— 第四部分*

---

一位总法律顾问走进工程评审会议。她只问一个问题:*"如果明天落地一份欧盟 AI 法案第 17 条的删除权请求,要求我们移除模型学到的关于某位特定患者的每一项事实,我们能证明已经做到了吗?"*

大多数团队不得不给出的诚实答案是:"我们可以微调模型让它遗忘。我们可以给你看训练运行记录。但我们无法证明这些信息在结构上已经消失,因为它可能在适当的对抗性提示下重新出现。"

这不是合规答案。这是带着程序性耸肩的无答案。

本文讲的是对自定义 LLM 而言,真正的合规答案是什么样子 —— 跨四个监管框架(**欧盟 AI 法案、GDPR 第 17 条、HIPAA、NIST AI RMF**),映射到我们为客户发布交付的四阶段流水线([Register → Gate → Roll → Observe](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/))。贯穿每一位监管者诉求的核心张力是**开放权重 vs 封闭 API**:你能对 Gemma 4 微调证明的事,和你对一个隐藏在不透明厂商 API 后面发布的版本能证明的事,并不是同一类。我们使用的回执格式逐行明确地说出了这一点。正是这种诚实让回执对审计人员有用。

## 四位监管者各自真正想要什么

合规讨论往往会塌缩成"我们把事情记录下来了"。这种说法过不了审计人员那一关。审计人员想要的是*他们无需信任你的基础设施就能验证的证据*。下文四个框架使用了不同的术语,但底层诉求是同一个。

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="四个监管框架及各自要求的验证原语。欧盟 AI 法案要求记录逻辑和人工监督;验证原语是通过 vIndex 提供的位精确机制性文档。GDPR 第 17 条要求对个人数据进行可验证删除;验证原语是带 SHA-256 回执的权重级 DELETE 补丁。HIPAA 要求访问审计和披露追踪;验证原语是每请求签名的决策日志。NIST AI RMF 要求治理、映射、测量和管理;验证原语是每次发布决策的哈希链回执。">
<title>四位监管者,一个验证诉求</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">四位监管者,同一个底层诉求:验证,而非信任</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">每个框架对验证原语的命名各不相同,但实质相同:审计人员可核验的加密证据。</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">欧盟 AI 法案</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">附件 IV 要求:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• 记录的逻辑</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• 训练数据摘要</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• 人工监督措施</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• 上市后监测</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">验证原语:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">通过 vIndex 提供的</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">位精确机制性文档</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">不合规处罚:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">最高达全球营业额</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">的 7%</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR 第 17 条</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">删除权要求:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• 可验证的数据移除</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• 可演示的遗忘</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• 对抗性提示下</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  的证明</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">验证原语:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">带 SHA-256 回执的</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">权重级 DELETE 补丁</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">不合规处罚:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">最高 2000 万欧元</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">或营业额 4%</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">访问控制要求:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• 访问审计轨迹</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• 披露追踪</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• 最小必要的</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  PHI 暴露</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">验证原语:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">每请求签名的</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">决策日志</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">不合规处罚:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">最高每违规类型</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">每年 190 万美元</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">四项核心职能:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• 治理</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• 映射</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• 测量</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• 管理</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">验证原语:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">每次发布决策的</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">哈希链回执</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">不合规处罚:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">自愿性框架</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(但在企业采购中</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">已是事实基线)</text>
</svg>
</figure>

让这些框架有意思的不是罚款数字。罚款数字让它们成为承重结构。有意思的部分是**验证原语** —— 每个框架真正想让交付物长成什么样。四者中有三个以不同的术语要求加密级别的证据。第四个(NIST AI RMF)是自愿性的,但在企业采购中事实上是必需的。它们最终汇聚到同一个形状:一份审计人员可以在不信任你的日志的前提下验证的交付物。

## 分界:开放权重 vs 封闭 API

在按阶段映射之前,先说本文中最重要的限定:

**对开放权重模型底座** —— Gemma、Qwen、Llama、Mistral、GPT-OSS,任何权重可寻址且可编辑的模型 —— 每一次 Divinci 的发布决策都会发出一份 vIndex 回执,其中包含一份**权重证明**:加密证据,证明决策时的活跃权重正好就是清单注册的权重。这正是让 GDPR 第 17 条可验证删除成为可能的关键。你应用一份 [DELETE 补丁](/zh/blog/deleting-paris-from-a-language-model/),从权重空间中移除某个特定的实体-关系,回执嵌入前后的哈希,审计人员就可以通过对照公开的 vIndex 重新跑一遍验证,确认删除已经发生。

**对封闭 API 模型底座** —— OpenAI、Anthropic、Google 通过不透明 API —— 同一份回执覆盖了决策链(用了哪份清单、哪次门控结果、哪次监控读数、哪位用户触发了哪个动作),但**无法主张权重来源**,因为提供方不公开权重。回执会在 `weight_attestation: null` 字段中明确说明,并附带一条解释原因的 `note`。这不是降级的合规姿态 —— 这是可验证内容的边界,被诚实地写下来了。读到这份回执的审计人员会清楚地知道哪一类证明在交付,哪一类不在。

这条分界线贯穿下文每一位监管者的诉求。只要某个框架在权重级别提要求,开放权重路径就能满足,封闭 API 路径就不能。我们会在回执里直接这么说,而不是暗示一种我们交付不了的证明。

## 每个框架如何映射到四个流水线阶段

流水线有四个阶段。每位监管者的诉求映射到其中一个或多个。下面的矩阵就是那张实际的映射图。

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="四个监管框架到 Divinci 四阶段发布流水线的映射。欧盟 AI 法案附件 IV 要求记录的逻辑和训练数据摘要映射到第 1 阶段 Register。欧盟 AI 法案要求的人工监督和上市后监测分别映射到第 2 阶段 Gate 和第 4 阶段 Observe。GDPR 第 17 条要求的可验证删除通过 DELETE 补丁映射到第 1 阶段 Register,通过回执映射到第 4 阶段 Observe。HIPAA 要求的访问审计和披露追踪映射到第 1、3、4 阶段。NIST AI RMF 的治理、映射、测量、管理跨越全部四个阶段。矩阵中有五个单元格被高亮以指示仅限开放权重的验证路径。">
<title>监管框架到流水线阶段的映射</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">哪个流水线阶段覆盖哪一项监管诉求</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = 完整覆盖。◐ = 仅限开放权重(需要权重证明)。封闭 API 路径覆盖决策链,但无法做出权重级主张。</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">框架 / 诉求</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">欧盟 AI 法案</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">附件 IV:记录的逻辑</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">附件 IV:训练数据摘要</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">人工监督措施</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">上市后监测</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR 第 17 条</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">可验证删除(DELETE 补丁)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">删除回执(哈希链)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">每请求访问审计</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">披露追踪 + 最小必要</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">治理 · 映射 · 测量 · 管理</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

两个 ◐ 单元格对应 GDPR 第 17 条 / 仅限开放权重的条目 —— 这些是封闭 API 路径无法完全满足的诉求。其余项目对两类底座都适用。

本文剩余部分逐个走过每个阶段的贡献。

## 阶段 ① —— Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">发布清单就是欧盟 AI 法案附件 IV 的技术文档。</span>
  </div>
</div>

Register 阶段产出一份不可变的 JSON 清单,使用 SHA-256 寻址。对于受监管的发布,清单在一份交付物中携带欧盟 AI 法案附件 IV<sup><a href="#ref-1">[1]</a></sup> 所要求的全部内容:

- 模型工件(HF 仓库 + 提交 SHA,或一个 vIndex 补丁引用)
- 提示模板(每个变量、每条系统消息 —— 受版本控制)
- 路由规则(哪一类流量落到哪个发布上)
- 用于计算门控阈值的数据集版本(按哈希给出的训练数据摘要)
- 上一次发布的 SHA(让审计链不断裂)
- 披露范围 —— 对 HIPAA 部署而言,模型被允许接收哪些 PHI 类别

清单就是文档。审计人员不会读散文;他们读清单哈希并验证整个包。不需要谁在六个月后写的散文摘要。

**开放权重的加分项。**当模型工件引用开放权重模型时,清单还会嵌入 `vindex_sha256` —— 该模型已发布的 [vIndex](/zh/compliance/) 的加密指纹。这个指纹让第三方可以验证活跃权重,而完全不必信任我们的部署基础设施。

**封闭 API 的限定。**当模型工件引用封闭 API 模型时,清单的 `vindex_sha256` 字段为 `null`,清单的 `weight_attestation_class` 为 `decision_chain_only`。读到此处的审计人员清楚地知道我们在主张什么,以及没在主张什么。

## 阶段 ② —— Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">分切片质量门承载欧盟 AI 法案的人工监督要求。</span>
  </div>
</div>

Gate 阶段是欧盟 AI 法案"人工监督措施"<sup><a href="#ref-1">[1]</a></sup>真正落地操作的地方。一个读完欧盟 AI 法案、得出"我们需要一个人工审批工作流"结论的监管者错过了要点 —— 更难的问题是*人工到底在审批什么*。Gate 阶段用每切片对人类锚定评分器的 Spearman ρ<sup><a href="#ref-3">[3]</a></sup> 回答了这个问题。在你的监管姿态中重要的每一个切片(儿科肿瘤学、IP 许可、比利时法语)都有自己的阈值。覆盖路径要求一份书面理由,并写入审计轨迹。

对受 HIPAA 约束的部署而言,这也是"最小必要"披露规则的归宿。门控的评分 QA 套件包含针对 PHI 过度暴露的负向测试 —— 那些在没有询问个人身份信息时却把它写进答案里的情况。一个在过度暴露切片上回归的发布会被门控拒绝,无论它在其他切片上表现如何。

对 NIST AI RMF 而言,Gate 阶段覆盖了"测量"职能 —— 系统在已配置容差内运行的分切片数值证据。

## 阶段 ③ —— Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">金丝雀检查点成为上市后监测的交付物。</span>
  </div>
</div>

欧盟 AI 法案的上市后监测<sup><a href="#ref-1">[1]</a></sup>要求运营方演示*持续的* —— 而非仅在上线前的 —— 对 AI 系统在真实条件下表现的观察。5% → 25% → 100% 的金丝雀加上质量监控检查点是满足这一要求最自然的方式。每个检查点的驻留时长,加上驻留期间的监控读数,正是审计人员想看的。

对 HIPAA 而言,金丝雀阶段也是每请求审计日志被端到端跑通的地方。每个检查点都会产出一批已签名的请求-响应回执样本;如果其中任何一份的 PHI 处理配置不当,它会在 5% 流量时浮现,而不是等到 100%。

## 阶段 ④ —— Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">持续监控 + 回执格式让 GDPR 第 17 条变得可验证。</span>
  </div>
</div>

这是真正赢得合规叙事的阶段。Observe 阶段通过当前发布持续地重放跟踪流量,由 Gate 阶段使用的同一位人类锚定裁判评分,并由一个质量监控器在越界时触发自动回滚。

每一次发布决策 —— 注册、门控通过、门控拒绝、门控覆盖、检查点提升、检查点保留、自动回滚、手动回滚,**以及任何 GDPR 第 17 条 DELETE 补丁的应用** —— 都会发出一份 vIndex 回执。它通过哈希链链接到该客户的上一份回执和该发布的上一份回执。

下面是一份针对 GDPR 第 17 条 DELETE 补丁的真实回执 —— 直接改编自[合规页面](/zh/compliance/)记录的格式:

```json
{
  "name": "gdpr-art17-patient-12348-removal",
  "version": 1,
  "base_model": "google/gemma-4-E2B-it",
  "manifest_sha256": "9abaeaf6c91f8b...",
  "previous_manifest_sha256": "8f72b1de4a93c5...",
  "created_at": "2026-05-29T03:17:42Z",
  "user_id": "compliance-officer-7c4e1a",
  "operation": {
    "op": "delete",
    "entity": "patient-record-12348",
    "relation": "diagnosis-association",
    "target": "weight-feature-11179-layer-27",
    "weight": -1.0
  },
  "verification": {
    "before_feature_11179_score": 17.34,
    "before_feature_11179_rank": 1,
    "after_feature_11179_score": null,
    "after_feature_11179_rank": "ABSENT_FROM_TOP_25",
    "perplexity_delta_wikitext103": "+0.02%",
    "vindex_sha256_before": "abc12...",
    "vindex_sha256_after":  "def34..."
  },
  "weight_attestation_class": "full",
  "chain_signature": "sha256(manifest || prev_manifest || user_id || created_at || prev_chain_signature)"
}
```

这份交付物是可验证的。审计人员不必信任我们的日志。他们拿走 `vindex_sha256_after`,从 `huggingface.co/Divinci-AI` 拉取对应已发布的 vIndex,验证第 27 层中的特征 11179 在结构上已从前 25 名中缺席。他们拿走 `chain_signature` 并对照前一份回执验证。整条链按客户配置的计划在外部锚定。

**对封闭 API 模型的相同操作。**上面的回执字段会有三处变化:`operation.target` 变为 `provider_api_endpoint`,`verification` 变为只覆盖决策链证据的另一种 schema,`weight_attestation_class` 变为 `decision_chain_only`。封闭 API 模型提供方没有公开权重,回执就这么写。想要权重级证明的审计人员现在知道他们需要去找提供方,而不是找我们。

这是 2026 年没有任何其他人交付的差异化。评估 CI 阵营(Braintrust、Humanloop、Patronus)不坐在流量上,也不发出决策回执。服务金丝雀阵营(SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>、KServe、Vertex、BentoCloud、Seldon)发出基础设施指标日志,但不发出哈希链式合规回执。可观测性阵营(Arize、Phoenix、Confident、Deepchecks)观察输出,但不强制执行。

## 审计人员实际会验证什么?

一个有用的练习:走一遍真实审计人员会问的问题,以及哪份交付物回答了每一个问题。

| 审计人员的提问 | 回答它的交付物 |
|---|---|
| *"3 月 15 日 14:22 UTC 跑的是哪个模型版本?"* | 该时间戳对应的 Observe 阶段回执,已签名并哈希链接。 |
| *"这次发布在提升前通过了什么评估?"* | Gate 阶段回执,带每切片 Spearman ρ 表和门控所跑数据集的 SHA。 |
| *"针对患者 X 的 GDPR 第 17 条删除请求确实执行了吗?"* | 上面那份 DELETE 补丁回执。审计人员对照已发布的 vIndex 验证 `vindex_sha256_after`。 |
| *"谁批准了这次发布?他们覆盖 IP 许可切片门控的理由是什么?"* | Gate 阶段回执的 `override` 块,包含用户 ID 和必填的自由文本理由。 |
| *"回滚多快触发?哪条监控读数触发了它?"* | Observe 阶段的回滚回执,包含三条连续低于阈值的质量读数和回滚耗时。 |
| *"给我看过去 90 天的上市后监测证据。"* | Observe 阶段的回执链。按客户配置的计划在外部锚定。 |

审计人员*不必做*的事:信任我们的 Datadog。信任我们的 CloudWatch。信任一张截图。信任一份导出。回执格式存在的全部意义就是让审计人员可以独立验证它。

## 这套方法没有解决的问题

三个诚实的限制:

**GDPR 第 17 条范畴下的封闭 API 回归在平台层无法解决。**如果你在封闭 API 模型背后运行一个医疗助手,患者援引第 17 条,平台可以证明该患者的记录已从你的检索库、提示模板和路由规则中移除 —— 但无法证明底层模型权重遗忘了该患者的数据。你需要要么一个开放权重底座,要么厂商承诺权重级删除。我们在回执里就这么说。

**文档是必要但不充分的。**一份证明模型达到某个阈值的回执,并不证明这个阈值就是对的阈值。如果你的评分 QA 套件没有覆盖在你的服务中对患者真正重要的那个切片,再多的回执链接也补不上这一刀。监管机构越来越理解这一点;如果评估本身是错的,"我们通过了评估"已经不再是充分的合规答案。

**vIndex 格式是单一厂商的。**我们使用它,因为它是当今最具体的、能用于权重级证明的加密原语。如果业界最终统一到另一种格式 —— 带哈希的模型卡、NIST 发布的工件 schema —— 回执格式应当随之演化。承重的实质(哈希链、可外部验证、感知权重证明)才是关键,而不是具体的 schema 名称。随着监管和标准格局的成熟,我们预期它会变化。

## FAQ

### 在 GDPR 第 17 条下,对 AI 系统而言什么是可验证删除?

可验证删除意味着第三方可以在无需信任你的日志的前提下验证数据已被移除。微调模型让它"遗忘"特定信息并不满足这一标准 —— 该信息可能在对抗性提示下重新出现,而且没有审计人员可核验的加密原语。一份权重级 DELETE 补丁,加上已发布的前后 vIndex 哈希,*确实*满足该标准,因为审计人员可以对照公开的工件重新跑一遍验证。

### 为什么封闭 API 模型不能以同样的方式满足 GDPR 第 17 条?

因为提供方不公开权重。在无法访问权重的情况下,任何第三方 —— 包括使用该 API 的客户 —— 都无法发起或验证一次权重级删除。回执的决策链部分(使用了哪份提示模板、数据来自哪个检索库、哪些路由规则是活跃的)仍然可验证,但权重级主张不可。这是权重私有时可验证内容的边界,而不是合规框架本身的局限。

### 用通俗的话说,欧盟 AI 法案附件 IV 要求什么?

附件 IV 要求一份技术文档,覆盖系统的逻辑、训练数据摘要、预期用途、人工监督措施和上市后监测。大多数团队掉进去的陷阱是把这五项当成五份独立的文档。第 1 阶段的发布清单把前三项需求作为一个单一哈希承载下来;Gate 阶段覆盖第四项;Roll + Observe 阶段覆盖第五项。一条流水线;四个诉求作为正常运营的副产物被满足。

### 对受 HIPAA 约束的部署,回滚应该多快?

HIPAA 没有规定具体的回滚时间,但 HHS 关于违规响应的指导把遏制时间视为承重指标。秒级的回滚(在清单驱动的切换上进行飞行中流量排空 —— 我们的数字大约是 12 秒)在结构上比依赖警报传播的典型基础设施指标蓝绿切换更快。对比公开的事后分析:Cloudflare 2022 年 6 月的事故<sup><a href="#ref-4">[4]</a></sup>花了 44 分钟才完成回退,因为工程师们互相覆盖了对方的回退。

### NIST AI RMF 如何映射到发布流水线?

NIST AI RMF 的四项核心职能 —— 治理、映射、测量、管理 —— 跨越整个发布生命周期,而不是某一个单独的阶段。治理是已记录的发布策略加上门控覆盖理由的工作流(Register + Gate 阶段)。映射是分切片的评分 QA 套件(Gate)。测量是分切片的 Spearman 阈值和持续质量监控(Gate + Observe)。管理是回滚路径和回执链(Observe)。当流水线发出完整的回执集时,四者都被覆盖。

## 参考资料

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Annex IV defines the technical documentation requirements for high-risk AI systems: system logic, training data summary, human oversight measures, post-market monitoring. Penalties up to 7% of global turnover for non-compliance.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> 600, max <code>MaximumExecutionTimeoutInSeconds</code> 1800. Cited as the industry-standard infra-metric canary that the Stage 4 quality monitor is contrasted against.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrated LLM-as-judge agreement.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) down to writing (36–44%). Anchor for the per-slice Spearman calibration that drives the Gate stage.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 minutes from "we know what to revert" to revert complete because engineers walked over each other's reverts. Anchor for the "manifest-driven rollback can't have that failure mode" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Voluntary framework — Govern, Map, Measure, Manage — that has become the de facto enterprise procurement baseline for AI governance. Voluntary but enforced in practice through customer due-diligence questionnaires.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Minimum-necessary disclosure, access audit, and breach response timing requirements applicable to any AI system that touches PHI. Civil monetary penalties up to $1.9M per violation-type per year per <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">CMP inflation adjustment, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Article 17 (Right to Erasure).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. The data subject's right to obtain erasure of personal data, and the controller's obligation to demonstrate compliance under Article 5(2) accountability. Penalties up to €20M or 4% of annual global turnover.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — vIndex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/zh/compliance/">compliance page</a> and demonstrated in the <a href="/zh/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*本系列下一篇:* **带即时回滚的自动化 LLM CI/CD 流水线。**本文展示了审计人员想要什么。下一篇展示让回执在数秒而非数周内送到审计人员桌面的操作模式 —— 四阶段流水线之下的自动化,重点说明回滚自行触发时会发生什么变化。
