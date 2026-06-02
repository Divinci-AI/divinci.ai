+++
title = "定制语言模型的 10 种 CI/CD 发布故障 —— 以及流水线里哪个阶段能逐一拦住它们"
description = "把定制 LM 推上生产时遇到的十种真实故障模式,每一种都对应到 Divinci 流水线中能在用户察觉之前拦下它的那个阶段 —— 注册、门禁、推送、观察。"
date = 2026-05-27T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Postmortems", "Evaluation Gates", "Rollback"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/10-ci-cd-release-failures-in-custom-language-models-veo31.webm"
hero_video_poster = "/images/10-ci-cd-release-failures-in-custom-language-models-hero-poster.webp"
reading_time = 11
summary = "我们通过 Divinci 的四阶段流水线发布过足够多次定制 LM,足以列出过去反复踩到的十种最具破坏性的故障模式。其中三种是切片感知的回归 —— 用聚合分门禁会被直接放行。还有两种是基础设施指标的金丝雀会顺手放过的静默质量下降。其余几种属于任何发布流水线本就应当抓到的错误 —— 我们把它们也列出来,是因为值得明说:用聚合分门禁的流水线在哪些情况下其实是能自行拦下的。"
+++

*发布周期手记 —— 第二部分*

---

[本系列第一篇](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)走过了我们使用的四阶段发布流水线 —— **注册 → 门禁 → 推送 → 观察**。这一篇是收据:十种我们如今已经用它抓到过的具体故障模式,每一种在实际中是什么样子,以及流水线的哪一个阶段把它挡在了生产之外。

清单按阶段而非严重度组织,因为阶段告诉你*该把投入放在哪里*,如果你自己也在搭建类似系统的话。如果你的门禁是薄弱环节,下面十种故障中会有六种持续打到你身上。如果你的观察器是薄弱环节,有两种会静默地打到你身上 —— 意思是你唯一能拿到的信号只能是客户投诉,这是最糟糕的一种信号。

能拦下这全部十种的流水线并不是一份功能清单。它是一小撮被一以贯之地做下去的架构决策。下面每一种故障都标明了对应的是哪一个决策。

## 如何阅读这份清单

每种故障都标注了拦下它的阶段:

- **① 注册** —— 清单层。拦下那种因为状态散落在多个系统里、导致你说不清楚是哪一处变更搞坏了生产的故障。
- **② 门禁** —— 针对校准过的人工锚定评分员的按领域 Spearman。拦下藏在聚合分背后的故障。
- **③ 推送** —— 5% → 25% → 100% 的金丝雀,每个检查点都有质量监控。拦下只有在规模上才暴露的故障。
- **④ 观察** —— 通过候选模型对生产请求做持续回放,由门禁所用的评分员打分。拦下延迟和 5xx 永远注意不到的静默质量下降。

每一节末尾给出**修复方案** —— 我们在 Divinci 实际发布的那份精确配置,以及如果你不用我们,自己需要搭什么。

---

## 阶段 ① —— 注册

### 1. 把模型 + 提示 + 路由打包同时上线,事后不知道是哪一个搞坏的

**发生了什么。** 我们在同一次发布里改了三件事:把基础模型从 Gemma 4 E2B 升到 Gemma 4 26B-A4B,在法律领域的 system prompt 中加了一条"引用法条"的指令,并调整了决定哪一类流量走哪一个模型的路由规则。合同起草的准确率掉了 7 个百分点。三项变更都没有被独立测试过。排障花了两天,每次只能回退一个变量。

**为什么流水线现在能拦下它。** 一次 Divinci 发布是一份不可变的清单,把 model_ref、prompt_template_ref、routing 和 dataset_version 打包成一个以 SHA-256 寻址的构件。当一份清单同时打包多于一个变更时,流水线会拒绝部署 —— *除非*上一个发布的 SHA 被作为对照基线显式引用。如果你确实想一次发三个变更,就必须在清单里承认这一点,而下一次发布会被强制回到"一次只改一个变量",这样故障归因的链路就能保持干净。

**修复方案。** 不要让人手工拼装发布。发布清单应当由一条*无法静默打包*的流水线来生成。API 见[阶段 1 —— 注册](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register)。

### 2. 在仪表盘里编辑 system prompt 直接上线,绕过代码评审

**发生了什么。** 有人在管理后台改了一下 system prompt,目的是"让模型少说点废话"。看上去只是改了一个词。改完后的 prompt 短了 38 个字符,刚好低于下游 prompt-rewriter 用来决定是否追加安全样板话的长度阈值。两小时后,模型开始回答它本该拒绝的问题。

**为什么流水线现在能拦下它。** Prompt 是注册清单的一部分。在仪表盘里改 prompt 意味着开一份新清单、生成一个新 SHA、门禁针对该变更跑起来。你仍然可以在仪表盘里改 prompt,只是不能在门禁没看见的情况下发上线。

**修复方案。** 把 prompt 当代码对待:用内容哈希做版本、作为发布的一部分注册、用评分 QA 套件门禁。Tianpan 的《"语义化版本谎言"》<sup><a href="#ref-1">[1]</a></sup>记录了这种故障模式在野外发生的真实案例 —— 一次 prompt 变更"通过了代码评审,部署时没有评估门禁,上了生产没有按用户做 A/B,也没有触发任何自动回滚"。

### 3. 训练-服务的预处理偏移

**发生了什么。** 训练流水线把某个字段做了空白归一化和小写化。服务流水线没做。同一个模型、同一个 prompt、同一份路由 —— 字节层面的输入却不一样。在开发夹具上一切都过。在真实流量上,模型表现得像是被重新训过一份更嘈杂的数据,因为从它的视角看,确实如此。

**为什么流水线现在能拦下它。** 清单除了 model_ref 之外,还会注册一份 `preprocessing_ref`。门禁评估走的是与生产服务栈相同的预处理。如果两边发生偏离,门禁的离线数字就不再与生产匹配,且按切片的 Spearman 会以一种在提升流量之前*可测量*的方式下降。

**修复方案。** 把预处理容器化、做版本化构件,在清单中引用它。如果门禁所用的预处理版本与生产将要用的版本不一致,就拒绝部署。

---

## 阶段 ② —— 门禁

下面四种故障是用聚合分门禁会被直接放行的那一类。**聚合分门禁拦不下它们的原因是结构性的,不是调参可解决的** —— 跨切片平均会摧毁掉那种你*真正用来*捕捉"回归只集中在某一个切片"的信号。

### 4. 知识产权许可坍塌(切片感知回归之一)

**发生了什么。** 一次 QLoRA 微调把法律 Q&A 在五个子领域上的准确率拉了起来,却把知识产权许可拖垮 —— 合同起草 0.71、法规解释 0.74、案例摘要 0.69、合规监管 0.66、管辖权分析 0.62、**知识产权许可 0.41**。六者的聚合 Spearman ρ 是 0.64。门禁阈值是 0.65。从单一聚合分看,这次发布是差一点点没过线。从按切片视图看,有一个子领域整整坍了 27 个百分点。

**为什么流水线现在能拦下它。** 门禁阈值是*按切片*的,不是聚合。任何单一切片低于其阈值都会把该发布标记为 `gate_fail`,与平均长什么样无关。[第一篇里的门禁阈值图](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate)就是流水线针对这一类发布实际产出的可视化。

**修复方案。** 把门禁切片化。真正重要的切片是你的客户分群子领域,而不是你从某个评估框架里 import 进来的分类树。

### 5. 儿科肿瘤切片回归(切片感知回归之二)

**发生了什么。** 一个医疗 Q&A 模型在追加了成人心血管数据后做了微调。聚合医学准确率提高 4 个百分点。儿科肿瘤准确率下降 11 个百分点 —— 新训练数据看起来在不经意间淡化了儿科剂量调整。聚合门禁会把它直接放过去。

**为什么流水线现在能拦下它。** 儿科肿瘤是客户在注册评分 QA 套件时配置的切片之一。门禁 2 的评估给出的按切片 Spearman ρ 从 0.72 跌到 0.61,低于儿科肿瘤切片 0.68 的阈值。标记 `gate_fail`。不上线。

**修复方案。** 让客户自己定义切片,而不是平台定义。平台应当允许客户在不写代码的前提下加一个切片以及对应的阈值 —— 因为 Divinci 这边没有谁比你的客户更熟悉他们领域的边界。

### 6. 多语种子语言漂移(切片感知回归之三)

**发生了什么。** 一个多语言模型为了改善法语回答做了微调。聚合法语准确率提升 3 个百分点。但在"法语"内部,模型在比利时法语和瑞士法语的地区变体上反而更差了 —— 训练语料里的巴黎法语占比过高。聚合的法语门禁会把它放过去。

**为什么流水线现在能拦下它。** 地区变体是语言切片下的子切片。按子切片的 Spearman 在提升流量之前抓到了比利时变体的回归。该发布被退回,要么 (a) 收一份更多样的训练数据,要么 (b) 写一份书面理由强制覆盖("我们接受这个地区性回归,因为这次铺开里聚合法语提升更重要") —— 覆盖会进入审计轨迹。

**修复方案。** 切片粒度很重要。"法语"太粗了。"比利时法语"才是回归真正藏身的层级。

### 7. 不写书面覆盖理由就绕过门禁

**发生了什么。** 一个高压发布窗口。门禁在某一个切片上失败 —— 在团队判断里,不是关键切片。有人伸手去按强制覆盖标志。在更早一版流水线里,强制覆盖只是一个布尔值。标志一翻,发布就上线了,三周后没人能复原出当时是谁针对哪个切片做了什么决定。

**为什么流水线现在能拦下它。** 强制覆盖是一道两字段门禁:`forceGateOverride: true` 加 `overrideReason: "..."`。理由是必填的自由文本字符串,与用户 ID 以及被覆盖的按切片门禁结果一起写进审计日志。流水线在没有理由时拒绝覆盖。你仍然可以覆盖 —— 只是不能匿名覆盖。

**修复方案。** 治理门禁不是一个独立阶段。它是门禁阶段本身的一项属性:每一次覆盖都是一张带理由文本的签名收据。

---

## 阶段 ③ —— 推送

### 8. 流量一步从 0% 拉到 100%

**发生了什么。** 一个模型干净地过了门禁,然后被立刻推到 100% 流量。由于对话长度上的一个怪癖,新模型在长度超过约 2,400 token 的响应上会超时 —— 这个行为在门禁的 100 道评估集上没暴露,因为每条测试 prompt 都很短。15% 的用户在 18 分钟里拿到超时,直到有人手动回滚。

**为什么流水线现在能拦下它。** 推送阶段在 5% 保持 `dwell_5pct_seconds`(默认 240)或 `requests_5pct`(默认 1,000)的时长 —— 二者取后到者。在 5% 流量下,长对话超时会在约 3 分钟内于 5xx 比率监控里浮现。如果任何检查点监控越界,流水线拒绝推进到下一档。平均到停机时间是 4 分钟,完全回滚的平均时间约为停机后 12 秒。

**修复方案。** 用三档金丝雀,加一个*质量*监控,而不是只看延迟和 5xx。"5% 等 20 秒就当通过"是危险的那一种模式。"5% 等 4 分钟"才是安全的那一种。

---

## 阶段 ④ —— 观察

下面两种故障是基于基础设施指标的金丝雀会把它们直接放行的。**基础设施指标拦不下它们,原因同样是结构性的** —— 延迟和 5xx 可以一直完美干净,而模型却在悄悄打太极、拒答或者幻觉。

### 9. 法律查询上的静默打太极(静默质量下降之一)

**发生了什么。** 一次安全调优的模型更新让法律领域助手明显变得更保守。延迟一样、5xx 比率一样、token 用量也一样。但在上一版回答"诉讼时效是 X 年"的地方,新版变成了"你应当咨询律师"。客户在数小时内就察觉了。各项面板都没动。

**为什么流水线现在能拦下它。** 阶段 4 的观察器对生产请求做持续回放、走在线模型,再用驱动门禁 2 的同一个校准评分员打分。打太极会立刻露馅,因为校准过的评分员 —— 锚定在"一个好的法律回答应当是什么样"的人工评级上 —— 会惩罚"在应当回答时拒答"。输出质量监控连续三分钟低于其区间,流水线自动回滚。从头到尾不到五分钟。

**修复方案。** 不要只监控延迟和 5xx。要在真实生产请求上,基于校准过的评分员,监控一个*质量*分。SageMaker 的部署防护栏<sup><a href="#ref-2">[2]</a></sup>会基于 CloudWatch 告警自动回滚 —— 对基础设施很有用,但前提是告警必须能基于某个指标触发,而"模型在打太极"并不是 CloudWatch 看得见的指标。

### 10. 微调后产生幻觉日期(静默质量下降之二)

**发生了什么。** 一次日程助手的微调开始信心满满地塞进输入里并不存在的日期。"你的会议在 3 月 32 日星期四。"延迟不变。5xx 比率不变。这种幻觉通过了安全过滤器,因为没有任何东西把"3 月 32 日"标为有害 —— 它只是不可能。

**为什么流水线现在能拦下它。** 观察器的校准评分员 —— 跑在真实生产日程请求上,而非合成的 —— 会给"自信但错"的答案打一个比合适的"我不知道"拒答更差的分。幻觉类的下跌在两分钟内触发了观察器的按分钟阈值。自动回滚启动。

**修复方案。** 一个针对领域专家校准过的评分员。通用的 LLM-as-judge 会像人粗扫一样漏掉"3 月 32 日星期四"。针对领域校准过的评分员 —— 锚定在领域专家评分上 —— 不会漏。

---

## 把这 10 种故障映射到流水线上

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="将十种故障模式映射到四个流水线阶段的矩阵图。阶段 1 注册抓 1(打包变更)、2(未版本化的 prompt)、3(训练-服务偏移)。阶段 2 门禁抓 4(知识产权许可切片回归)、5(儿科肿瘤切片回归)、6(多语种子语言漂移)、7(无理由绕过门禁)。阶段 3 推送抓 8(一步铺开)。阶段 4 观察抓 9(静默打太极)、10(幻觉日期)。">
<title>按流水线阶段划分的故障模式</title>
<rect width="900" height="420" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">每种故障在哪里被拦下</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">三种切片感知的回归落到门禁。两种静默质量下降落到观察。其余分布在注册和推送之间。</text>
<g>
<rect x="40" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="140" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">① 注册</text>
<rect x="250" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="350" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">② 门禁</text>
<rect x="460" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="560" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">③ 推送</text>
<rect x="670" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="770" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">④ 观察</text>
</g>
<g>
<rect x="40" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="163" font-size="11" font-weight="700" fill="#1e3a2b">1. 打包变更</text>
<text x="50" y="178" font-size="10" fill="#6b5d4f">模型 + 提示 + 路由</text>
<text x="50" y="191" font-size="10" fill="#6b5d4f">被静默打包同发</text>
<rect x="40" y="210" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="228" font-size="11" font-weight="700" fill="#1e3a2b">2. 未版本化的提示</text>
<text x="50" y="243" font-size="10" fill="#6b5d4f">仪表盘编辑</text>
<text x="50" y="256" font-size="10" fill="#6b5d4f">绕过门禁</text>
<rect x="40" y="275" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="293" font-size="11" font-weight="700" fill="#1e3a2b">3. 训练-服务偏移</text>
<text x="50" y="308" font-size="10" fill="#6b5d4f">离线与在线的</text>
<text x="50" y="321" font-size="10" fill="#6b5d4f">预处理发生偏离</text>
</g>
<g>
<rect x="250" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="163" font-size="11" font-weight="700" fill="#a04848">4. 知识产权许可切片</text>
<text x="260" y="178" font-size="10" fill="#6b5d4f">切片 0.41,聚合 0.64</text>
<text x="260" y="191" font-size="10" fill="#6b5d4f">聚合分会放行</text>
<rect x="250" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="228" font-size="11" font-weight="700" fill="#a04848">5. 儿科肿瘤</text>
<text x="260" y="243" font-size="10" fill="#6b5d4f">切片下降 11 个百分点</text>
<text x="260" y="256" font-size="10" fill="#6b5d4f">聚合分会放行</text>
<rect x="250" y="275" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="293" font-size="11" font-weight="700" fill="#a04848">6. 多语种子语言漂移</text>
<text x="260" y="308" font-size="10" fill="#6b5d4f">比利时法语发生回归</text>
<text x="260" y="321" font-size="10" fill="#6b5d4f">聚合分会放行</text>
<rect x="250" y="340" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="260" y="358" font-size="11" font-weight="700" fill="#1e3a2b">7. 绕过覆盖</text>
<text x="260" y="373" font-size="10" fill="#6b5d4f">需要书面</text>
<text x="260" y="386" font-size="10" fill="#6b5d4f">理由 + 审计条目</text>
</g>
<g>
<rect x="460" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="470" y="163" font-size="11" font-weight="700" fill="#1e3a2b">8. 0% → 100% 一步铺开</text>
<text x="470" y="178" font-size="10" fill="#6b5d4f">没有检查点驻留</text>
<text x="470" y="191" font-size="10" fill="#6b5d4f">长尾 bug 在规模上暴发</text>
</g>
<g>
<rect x="670" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="163" font-size="11" font-weight="700" fill="#a04848">9. 静默打太极</text>
<text x="680" y="178" font-size="10" fill="#6b5d4f">延迟 + 5xx 不变</text>
<text x="680" y="191" font-size="10" fill="#6b5d4f">评分员抓得到</text>
<rect x="670" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="228" font-size="11" font-weight="700" fill="#a04848">10. 幻觉日期</text>
<text x="680" y="243" font-size="10" fill="#6b5d4f">"3 月 32 日"</text>
<text x="680" y="256" font-size="10" fill="#6b5d4f">领域评分员抓得到</text>
</g>
</svg>
</figure>

图中染成红色的条目是我们在搭建这条流水线*的过程中*发现的故障 —— 它们正是我们最终特地去构建切片感知门禁和请求回放观察器的原因,而不是像别人那样发一款只看基础设施指标的通用金丝雀。

## LLM 的 CI/CD 与软件的 CI/CD 有什么不同?

简短版:LLM 发布不是一个确定性的构件。同一个 prompt 在不同次运行里会产生不同输出。同一份评估集在不同硬件上会得到不同的分。同一个模型可以通过聚合的质量检查,却在你没纳入评估的某个切片上静默失败。传统 CI/CD 所依赖的大多数假设,在与一个概率系统接触时都无法存活。

三条具体的后果:

1. **你不能写 `expect(output).toEqual(X)` 这样的断言。** 你需要的是分布感知的评估,消费的是与人工锚定评分员的等级相关性,而不是与某个夹具的相等性。
2. **"过了 CI"的模型一样可能上线坏行为。** CI 过了只代表代码能跑。它不代表模型正确。发布流水线需要在 CI 提供的*正确性*门禁之上再叠一道*质量*门禁。
3. **回滚不是可选项,也不是慢动作。** 因为故障模式是概率性的 —— 而且其中一些在基础设施层是静默的 —— 回滚路径必须是一等基础设施,而不是后备方案。发布清单存在的目的,就是要让回滚是原子的。

本系列第一篇描述了应对这些后果的四阶段架构。这一篇描述它能拦下的故障。

## 怎样为定制 LM 搭一条抗故障的 CI/CD 流水线?

诚实的答案:接受故障一定会发生,然后把*故障发生*到*生产流量回到一个已知良好版本*之间的时间压到最短。前面那条四阶段流水线是这一原则的一种具体实现,但真正重要的是原则本身。

如果你不用 Divinci 而想自己搭出对等的东西,承重部件是:

- **一份不可变的发布清单**,把模型 + 提示 + 路由 + 数据集 + 预处理打包成一个 SHA。这是让 1、2、3 可被抓到的前提。([阶段 1](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register))
- **一道按切片的门禁**,阈值由领域负责人定义,而不是平台方。这是让 4、5、6 可被抓到的前提。([阶段 2](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate))
- **每个检查点都有质量监控的金丝雀**,而不是只看延迟和 5xx。这是让 8 可被抓到、9 和 10 一旦冲到生产仍*可以救*的前提。([阶段 3](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-3-roll))
- **一个持续观察器**,用与门禁同一个校准评分员,对真实生产请求走在线模型打分。这是让 9 和 10 可被抓到的前提。([阶段 4](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-4-observe-rollback-and-the-receipt))
- **每一项决策都附带一份签名的审计凭证。** 哈希链式、可对外锚定。对于开放权重模型支撑的发布,凭证内嵌一份 [vIndex 权重证明](/zh/compliance/),证明在线权重正是清单所注册的那一份。对于闭源 API 支撑的发布,凭证覆盖决策链,但不主张权重出处 —— 审计轨迹会明示这一点。

各个部件本身并不新颖。每个 MLOps 平台都有其中一两个。但这种组合 —— 切片感知门禁 + 生产请求观察器 + 原子回滚 + 可证明的凭证 —— 是 2026 年没有其他人在发的那一部分。

## 下一步去哪儿

- 配套文章 —— **[如何用 Divinci AI 构建 LLM CI/CD 流水线](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)** —— 介绍架构与 API。
- **[合规页面](/zh/compliance/)**记录了支撑每一项发布决策的 vIndex 凭证格式,以及它如何对应到欧盟 AI 法案、GDPR 第 17 条、HIPAA 和 NIST AI RMF。
- **[AutoRAG 产品页](/zh/autorag/)**介绍 RAG 侧的幻觉削减能力,它与驱动门禁 2 和阶段 4 观察器的校准评分员天然成对。
- **[API 参考](/zh/api/)** —— 本系列引用的每一条命令都是真实的端点。

## FAQ

### 自研语言模型最常见的 CI/CD 故障是什么?

在我们交付的所有版本中,破坏力最大的单一故障是**通过聚合门禁的切片级回退** —— 模型在平均值上有所提升,却在某个特定子领域悄悄崩塌(对应上文中的故障 4、5 和 6)。它比缺失回滚更常见,比提示漂移更常见,也比两者都更难检测。修复方法是结构性的,而非参数调优:按切片设门禁,而不是按平均值。

### 一次糟糕的 LLM 发布,回滚应该多快?

数量级是秒,不是分钟。Divinci 流水线上的平均回滚时间约为 12 秒 —— 这是约 100 副本服务上正在处理请求的排空时间,而不是清单切换本身,后者是亚秒级。让这一切成为可能的架构决定是**打包式的发布清单**:因为每个组件(权重、提示、路由、数据集)都由同一个 SHA 引用,回滚就是一次原子级的重新指向。对比公开的事故复盘:Cloudflare 2022 年 6 月的事故<sup><a href="#ref-3">[3]</a></sup>花了 44 分钟才回退,因为工程师们互相踩在对方的回退上;Atlassian 2022 年 4 月的故障<sup><a href="#ref-4">[4]</a></sup>每个受影响站点用了 12 小时才恢复,因为状态分散在多个系统中。

### 为什么提示词改动会造成这么多生产故障?

因为提示词经常在 CI/CD 流水线之外被编辑 —— 在仪表盘里、在管理后台 UI 里,有时甚至由没有工程评审的人来改。它们被当作配置对待,实际表现却像代码。对系统提示词做一个 38 个字符的改动,可能比一次模型再训练更能改变下游模型的行为。修复方法是把提示词作为发布清单的一部分进行登记,并要求它通过模型所要通过的同一道门禁。

### 如何检测 LLM 输出中悄无声息的质量下降?

不能用基础设施指标。延迟、5xx 错误率和 token 用量都抓不到模糊回避、本该作答时却拒答、或日期幻觉这类问题。检测信号必须来自一个针对真实生产轨迹、由校准评分员计算出的*质量*分。Divinci 流水线中的阶段 4 观察器会把生产轨迹的一个滚动样本回放给当前激活的模型,用驱动 Gate-2 的同一套人锚定 Spearman 评分员打分,并在质量分连续三分钟跌破阈值时触发自动回滚。

### AI 模型部署需要满足哪些审计追溯要求?

EU AI Act、GDPR Article 17(被遗忘权)、HIPAA 和 NIST AI RMF 都要求组织保留模型版本、评估结果、审批决策和发布过程的记录。这四套要求底下隐含的一条共同要求是:这些记录必须*可验证* —— "可审计"远不止于"我们有日志"。Divinci 的 vIndex 凭证是哈希链式的,并可在外部锚定,这意味着审计方无需信任我们的日志就能验证整条链。对于开放权重的模型后端,凭证还会内嵌权重证明;对于闭源 API 后端,凭证则明确标注未对权重出处作出主张。

## 参考文献

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan —— <em>"语义化版本谎言":一次 LLM 小版本更新如何搞坏生产</em></a>(2026 年 4 月)。直接点名了仪表盘提示编辑这种故障模式。配套阅读:<a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM 故障复盘模板 —— SRE 漏掉的字段</em></a>。
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker —— <em>使用金丝雀流量切换</em></a>。标准的以基础设施指标驱动的自动回滚。便于对比阶段 4 观察在做哪些不同的事情(质量分,不是 CloudWatch 告警)。
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare —— <em>2022 年 6 月 21 日 Cloudflare 故障</em></a>。因为工程师互相在对方的回退上又做了回退,花了 44 分钟才回退。被引为"回滚本身就是另一种事故"的锚点。
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian —— <em>2022 年 4 月故障事后评审</em></a>。每个站点恢复花了 12 小时。状态散落在多个系统中的故障模式,其最严重的形态。
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA —— <em>软件交付绩效指标</em></a>。"部署失败恢复时间"的精英表现者门槛被记录为小于一小时。便于框定回滚速度的"够快是多快"。
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">Zheng 等,<em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a>(arXiv:2306.05685,2023)。这是为什么 LLM-as-judge 在总体上能与人工评级匹配、却在不同类别之间差异很大的参考 —— 而这恰恰是让按切片门禁成为必要的那种模式。
  </li>
</ol>

---

*本系列下一篇:* **在受监管领域中验证并发布定制 LM。** 上述流水线是架构。合规路径是使用它的实践。欧盟 AI 法案、GDPR 第 17 条、HIPAA 和 NIST AI RMF —— 它们各自对一次发布流程提出了什么要求,以及 vIndex 凭证的哪些字段覆盖哪一项要求。
