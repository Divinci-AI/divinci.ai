+++
title = "如何分七步诊断自定义 LLM 的 QA 失败"
description = "大多数“QA 失败”并非模型失败——而是评测覆盖率缺口、评审器校准偏差或训练与服务环境不一致。一套七步诊断法,可在归咎于模型之前先排除六类非模型成因。"
date = 2026-05-31T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["QA", "Diagnostics", "Postmortems", "LLM Ops", "Evaluation", "Debugging"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-diagnose-custom-llm-qa-failures-in-7-steps-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/how-to-diagnose-custom-llm-qa-failures-in-7-steps-hero-poster.webp"
reading_time = 11
summary = "当 QA 告警在自定义 LLM 上触发时,本能反应往往是归咎于模型。但在我们经手的所有发布中,模型大约只在七次告警里有一次是真正的“罪魁祸首”。其余六次的根因都在评测、评审器、提示词 SHA、预处理流水线、数据集版本或检索索引中。本文是我们实际走过的诊断决策树——按顺序排列,并附上回答每一分支所用的精确 API 调用。"
+++

*发布周期手记 —— 第六部*

---

某客户的医学问答模型上,一套打分式 QA 评测套件开始触发告警。头条指标——全切片综合质量——一夜之间下降了 6 个百分点。团队为此调试模型整整两天。他们重新跑了微调,回滚到上一版发布。数字纹丝不动。

第三天早上,有人注意到评测套件正是在回归开始的当晚被更新过。测试集中新加入了三条儿科剂量类提示,而这个模型在训练阶段从未见过儿科剂量场景。这场“QA 失败”并不是模型回归,而是一次切片覆盖事件:评测开始考察模型本就不该掌握的内容。

在我们经手的客户上线中,这种情况非常常见。**“QA 失败”告警只是症状,真正源自模型的概率大约只有七分之一。** 另外六次,问题都潜伏在上游:评测设计、评审器校准、提示词 SHA、预处理流水线、数据集版本,或检索索引中。这六类问题从告警上看几乎完全相同——某个数字下降了——但修复方式天差地别。

本文是我们在告警触发后按顺序走过的诊断决策树。先用六步排除非模型成因,最后第七步才考虑模型本身。每一步都对应一条具体的 API 调用或查询语句。走完前六步后,你要么准确知道该修哪里,要么获得了去看模型的资格。

## 决策树

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="QA 失败告警的诊断决策树。第 1 步询问评测是否覆盖了该切片(若否,则告警为评测覆盖缺口)。第 2 步询问评审器在该切片上是否对齐人工(若否,则告警为评审器校准偏差)。第 3 步询问提示词模板 SHA 是否与生产一致(若否,则告警为提示词漂移)。第 4 步询问预处理是否与生产一致(若否,则告警为训练与服务不一致)。第 5 步询问数据集 SHA 是否与生产一致(若否,则告警为数据集漂移)。第 6 步询问检索索引版本是否与生产一致(若否,则告警为 RAG 索引漂移)。只有当全部六步都排除非模型成因后,第 7 步才得出结论:这是一次真正的按切片模型回归。">
<title>七步诊断决策树</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">QA 告警触发时,先向下排查,而非直接深入模型</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">六步排除非模型成因,只有第七步才归咎于模型。</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  QA 告警触发</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">评测是否覆盖该切片?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ 若否:评测覆盖缺口。更新套件,重新测试。</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">评审器在该切片上是否对齐人工?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ 若否:评审器校准偏差。重新校准 ρ,重测。</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">提示词模板 SHA 是否与生产一致?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ 若否:提示词漂移。重新登记清单。</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">预处理流水线是否与生产一致?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ 若否:训练与服务不一致。绑定预处理 SHA。</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">数据集 SHA 是否与生产一致?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ 若否:数据集漂移。以正确 SHA 重新登记。</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">检索索引 SHA 是否一致?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ 若否:RAG 索引漂移。</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">若 6 步全部通过:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">这是真正的按切片模型回归。</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">提交、回滚、重新训练。</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">经验数据显示模型</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">作为正确答案的概率</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">大约是七次告警中一次。</text>
</svg>
</figure>

之所以采用顺序结构,是因为各步成本由低到高。第 1 步只是对评测套件做一次 `git diff`;第 7 步则是一轮完整的微调。你应该在每个便宜的检查上花十分钟,然后再去花一周做最贵的那个。

## 第 1 步——评测是否覆盖了该切片?

**症状。** 综合质量下降,但按切片拆分时,只有一个切片暴跌,其他切片基本持平。或者更令人困惑——*所有*切片都略有下降,降幅相近。

**诊断方法。** 将本次发布的评测套件清单 SHA 与上一次发布做差异比较。如果评测套件变了,而模型没有改动,那么回归发生在评测,而不是模型。

```bash
# 比较两次发布间的评测套件清单 SHA
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# 不一致?评测变了。审查新增内容。
```

**修复方法。** 要么回滚评测套件的变更(如果是无意中改的),要么扩充训练覆盖以匹配新评测(如果新切片确属真实生产场景)。不要为评测覆盖问题去发布一次模型回归修复——那只会让模型在它原本擅长的任务上更糟。

**在我们流水线中,问题藏在哪里。** [阶段 1——登记](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) 将评测套件 SHA 绑定到发布清单中。上面的诊断就是简单地对两份清单做差异比较。医学问答团队之所以花了两天,是因为他们没有清单级别的差异——他们比对的是模型 checkpoint,而不是发布清单。

## 第 2 步——评审器在该切片上是否对齐人工?

**症状。** 评测套件中*新加入*的切片得分很差,但对模型输出在该切片上的人工复核认为这些输出没有问题。评审器认为模型在失败,人却不这么看。

**诊断方法。** 在该失败切片上抽取 50 条人工评分样本,计算 LLM 评审器与之的 Spearman ρ。若 ρ &lt; 0.4,则评审器在该切片上并*未测量*人类所测量的内容。

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**修复方法。** 要么为该切片选择不同的评审模型,要么使用带仲裁器的评审器链。MT-Bench<sup><a href="#ref-1">[1]</a></sup>显示,GPT-4 作为评审器与人类的平均一致率超过 80%,但各类别方差很大——从编程类的 86% 到写作 / 人文类的 36–44%。真正起决定作用的是方差;“平均不错”掩盖了那些评审器明显出错的切片。

**在我们流水线中,问题藏在哪里。** [阶段 2——把关](/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) 要求每个切片都要有一个经过校准的评审器。[Calibrating the AI Judge](/zh/blog/calibrating-the-ai-judge/) 一文记录了具体流程。如果新切片在加入评测时没有走校准步骤,那么这道关卡本身在结构上就不可信。

## 第 3 步——提示词模板 SHA 与生产一致吗?

**症状。** 质量下降,但 model_ref 和 dataset_ref 都没动。训练侧没有任何变化。模型还是那个模型。然而结果就是变了。

**诊断方法。** 将失败发布清单中的 `prompt_template_ref` SHA 与上一次发布对比。一处“为提升简洁度”而对系统提示做的 38 个字符的小改动,对下游行为的影响可能超过一次完整重训。

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# 不一致?把 diff 拉出来,逐行细看。
```

**修复方法。** 把提示词当代码对待。[10 release failures 一文](/zh/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) 涵盖了“后台改提示词”这一典型失败模式——Tianpan 的 *Semver Lie* 复盘<sup><a href="#ref-2">[2]</a></sup>将其列为 2026 年最主导的失败模式。如果你能证明提示词改过,那 bug 就找到了。

## 第 4 步——预处理流水线与生产一致吗?

**症状。** 模型在本地能通过评测,完全相同的模型却在生产环境中失败。model_ref 一样,提示词一样,数据集一样。

**诊断方法。** 从生产清单中拉取 `preprocessing_ref` SHA,并核对评测使用的是不是同一个。最经典的情况:训练侧规范了空白字符并做了小写化,生产却没有。评测当时跑的是生产预处理,一切都对得上——直到某天有人单边更新了预处理。

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# 与你的训练 / 评测流水线实际使用的预处理对比。
```

**修复方法。** 将预处理容器化为带版本的产物,在清单中引用它。一旦关卡的预处理 SHA 与生产不一致,就拒绝部署。

## 第 5 步——数据集 SHA 与生产一致吗?

**症状。** 失败发布在关卡评测中的得分,与*同一个*模型前一天的关卡评测得分不同。

**诊断方法。** 对比两次发布的 `dataset_version` 字段。评测套件名字没变,但数据集内容被更新并重新打标了。同名,不同 SHA,得分自然不同。

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**修复方法。** 对数据集采用内容哈希。数据集名字不是版本;SHA 才是。

## 第 6 步——检索索引 SHA 与生产一致吗?

**症状。** 仅适用于 RAG 工作负载。依赖检索上下文的问题质量下降,直接作答的问题则不受影响。

**诊断方法。** 从清单中拉取 `retrieval_index_ref` SHA,与关卡评测当时使用的检索索引对比。RAG 索引在夜里重新抽取一次更新了;关卡评测缓存的是旧索引;生产灰度用的是新索引。

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**修复方法。** 将检索索引 SHA 像绑定预处理一样绑定到清单中。[AutoRAG](/zh/autorag/) 自动化的索引轮换节奏让这一步尤其值得检查——如果你不固定索引,无论是否得到你的授权,它都*会*自行更新。

## 第 7 步——最后才是模型本身

六步走完。评测覆盖了切片。评审器经过校准。提示词 SHA 一致。预处理一致。数据集一致。检索索引一致。

到现在——且只到现在——你才获得了去看模型的资格。

这一步的诊断方法是:用清单固定的同一份数据集、同一套预处理、同一个检索索引,对失败发布和上一版发布分别评测,然后做按切片的 Spearman 比对。所得的数字是一个干净的信号:一次真正的按切片回归,没有上游干扰因素。

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

如果差值证实了真实回归:[自动回滚](/zh/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)就会触发(如果你还没有手动触发的话),失败模型将基于扩展过的切片覆盖语料重新训练。如果当初放行该发布的关卡一开始就漏掉了这个切片,那么[关卡本身也是 bug](/zh/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate)——你的发布流水线缺失了能力 4。

## 真实分布是什么样的

前文那句“七分之一”不是修辞手法,而是大致刻画了我们在客户上线中观察到的分布。在每七次 QA 告警中:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="QA 告警根因分布的饼图。评测覆盖缺口约占 32%。评审器校准偏差约占 18%。提示词漂移约占 16%。预处理不一致约占 12%。数据集漂移约占 7%。RAG 索引漂移约占 5%。真实模型回归约占 10%。来自客户上线的内部观察,非来自受控基准。">
<title>QA 告警根因分布</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">客户上线中,bug 实际出现的位置</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">内部观察,非受控基准。模型作为正确答案的概率大约是每七次告警一次。</text>
<g transform="translate(220, 230)">
<path d="M 0 -120 A 120 120 0 0 1 113.7 -38.3 L 0 0 Z" fill="#2d5a4f"/>
<path d="M 113.7 -38.3 A 120 120 0 0 1 88.3 81.4 L 0 0 Z" fill="#7a9580"/>
<path d="M 88.3 81.4 A 120 120 0 0 1 -29.7 116.3 L 0 0 Z" fill="#b8a080"/>
<path d="M -29.7 116.3 A 120 120 0 0 1 -113.7 -38.3 L 0 0 Z" fill="#c87b3c"/>
<path d="M -113.7 -38.3 A 120 120 0 0 1 -101.1 -64.7 L 0 0 Z" fill="#d4c8b0"/>
<path d="M -101.1 -64.7 A 120 120 0 0 1 -75.6 -93.2 L 0 0 Z" fill="#a04848"/>
<path d="M -75.6 -93.2 A 120 120 0 0 1 0 -120 L 0 0 Z" fill="#1e3a2b"/>
</g>
<g font-size="11" fill="#1e3a2b">
<rect x="500" y="100" width="14" height="14" fill="#2d5a4f"/>
<text x="522" y="112" font-weight="600">1.  评测覆盖缺口</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  评审器校准偏差</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  提示词漂移</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  预处理不一致</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  真实模型回归</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  数据集漂移</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  RAG 索引漂移</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">仅第 1、2 步就占了告警的一半。先排查评测,再排查模型。</text>
</figure>

两个最大的扇区分别是*评测覆盖缺口*和*评审器校准偏差*,合计占 QA 告警的一半。这两类都不是模型问题,而是你*测量*模型方式的问题。

## 这一方法解决不了什么

三点诚实的局限:

**这份分布是我们的,不是你的。** 上述百分比来自我们的客户群体和我们的流水线工具。如果你的工作负载与我们不同——重度多模态、重度智能体编排、重度单轮生成——你的分布会不一样。诊断顺序仍然成立;但每一步背后的数字不一定通用。

**第 1 步的“评测覆盖缺口”最难修。** 把缺失切片加入训练语料、为它构建校准过的评审器、再重新跑灰度,本身就是一项耗时数周的工程。诊断很快,补救则慢。

**真实回归可能搭着非模型 bug 一起出现。** *既*有提示词漂移*又*有真实模型回归的案例,是最难处理的:第 3 步发现了提示词漂移,你修复后告警又重新触发。本文的诊断顺序能处理这种情况,但会拉长总耗时。“bug 同时藏在两个地方”——没有捷径可走。

## FAQ

### 为什么我的 LLM 在相似的提示词下产生不同的输出?

提示词敏感性确实存在,但它并不总是 QA 告警的*成因*——有时它只是上游 bug 的*症状*。先按顺序走诊断流程。如果提示词模板 SHA 一致、预处理一致、数据集一致,那么没错——模型在该切片上方差很大,你需要更确定性的解码路径或换一个评审器。但如果上游有任何改动,先修上游。

### LLM 基准测试应该多久重新评估一次?

每当某个生产切片的流量结构发生显著变化时,就要重新评估基准*内容*。基准的*评审器校准*则至少每季度复核一次——评审模型的漂移速度比你想象的快。误报 QA 告警最大的来源,就是一份 18 个月前最后校验过、如今却仍在度量生产早已不做的事情的基准。

### 自定义语言模型为什么会产生幻觉?

幻觉的上游成因有多种——检索失败(对应上文决策树的第 6 步)、训练覆盖缺口(间接对应第 1 步),以及解码路径问题(对应第 7 步的真实模型问题)。[AutoRAG](/zh/autorag/) 通过把检索索引绑定到发布清单,并在每次发布时重新固定索引,解决了检索侧的成因。另外两类问题需要在模型上游做流水线层面的修复。

### 你怎么知道训练数据本身就是问题?

如果失败发布中的数据集 SHA 与上一次正常发布中的数据集 SHA 相同(决策树第 5 步),那么数据本身并不是*直接*成因。如果两者不同,那你就找到根因了。更难回答的问题——“数据集对我们生产切片的覆盖*完整*吗?”——正是第 1 步要测试的。一份对评测完整、但对生产流量不完整的数据集,本质上是切片覆盖问题。

### 不重新训练整个模型,能不能修好 QA 失败?

可以——七次告警中有六次,修复都不需要重训。决策树的第 1–6 步都有不触碰模型的修复方法:更新评测、重新校准评审器、重新登记提示词 SHA、修正预处理、重新固定数据集、重新固定检索索引。重训是第 7 步,是最昂贵的修复方法,只为真正的模型回归保留。发布流水线的[审计轨迹](/zh/compliance/)让你用与模型变更相同的可追溯纪律,完成这些上游修复。

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement with per-category variance from coding (86%) down to writing (36–44%). Anchor for step 2 — why judge calibration has to be measured per slice rather than assumed from a published headline number.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). The dominant 2026 failure-mode writeup. Names dashboard-edit prompt drift as the most-cited cause of production LLM incidents. Anchor for step 3.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — Measure function.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>. The "Measure" function explicitly covers benchmark-validity and evaluation-coverage as part of governance, not as a separate engineering concern. Cited as the institutional anchor for treating eval design as the first diagnostic step.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — retrieval-augmented generation evaluation.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). The reference framework for RAG-side evaluation. Anchor for step 6 — separating retrieval failures from generation failures requires a RAG-aware eval discipline.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — root-cause distribution across customer rollouts.</strong> The percentages in the pie chart are our internal observation across Divinci customer rollouts, not from a controlled benchmark. Your distribution will vary by workload type, fine-tune cadence, and team discipline. The relative ordering (steps 1–2 dominating) is stable across the cohort we've measured; the exact percentages are not portable to your environment without your own data.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The four-stage release pipeline.</strong> <a href="/zh/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Each diagnostic step in this post corresponds to a manifest field bound at Stage 1 — Register. Without the manifest discipline upstream, the diagnostic loses its grip; you can't diff what you didn't bind.
</li>
</ol>

---

*本系列下一篇:* **Automated Regression Testing for Custom LLMs in 2026.** 本文讨论的是 QA 告警触发*之后*的诊断。下一篇要谈的,则是一开始就驱动这条告警的回归测试纪律——评测里该放什么、如何让它保持诚实,以及当回归测试开始与你的评审器意见相左时,该怎么办。
