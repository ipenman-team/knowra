'use client';

import { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

const productShots = [
  {
    key: 'workbench',
    label: '工作台',
    src: 'https://contexta-1259145770.cos.ap-beijing.myqcloud.com/workbench-preview.jpg',
    alt: '工作台预览（占位图）',
  },
  {
    key: 'editor',
    label: '编辑器',
    src: 'https://contexta-1259145770.cos.ap-beijing.myqcloud.com/doc-editor-preview.jpg',
    alt: '编辑器预览（占位图）',
  },
  {
    key: 'ai',
    label: 'AI',
    src: 'https://contexta-1259145770.cos.ap-beijing.myqcloud.com/contexta-preview.jpg',
    alt: 'AI 问答预览（占位图）',
  },
];

export function LandingHome() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const timer = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 3500);

    return () => window.clearInterval(timer);
  }, [carouselApi]);

  const enterApp = useCallback(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-dvh bg-background">
      <header
        className={cn(
          'sticky top-0 z-20 border-b bg-background/80 backdrop-blur transition-shadow',
          scrolled ? 'shadow-sm' : 'shadow-none'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-primary" aria-hidden="true" />
            <span className="text-sm font-semibold">Contexta</span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">产品</a>
            <a href="#usecases" className="hover:text-foreground">场景</a>
            <a href="#ai" className="hover:text-foreground">AI</a>
            <a href="#security" className="hover:text-foreground">安全</a>
            <a href="#pricing" className="hover:text-foreground">价格</a>
            <a href="#help" className="hover:text-foreground">帮助</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={enterApp}>
              登录
            </Button>
            <Button variant="default" onClick={enterApp}>
              免费开始
            </Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section id="product" className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                文档协同 · 知识管理 · AI 任务流
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                一个工作空间，免除繁琐任务
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                导入你的文档与页面，Contexta 用 AI 帮你检索、总结、生成任务并追踪进度。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={enterApp}>
                  免费开始
                </Button>
                <Button size="lg" variant="outline" onClick={enterApp}>
                  申请演示
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-2xl bg-gradient-to-tr from-primary/10 via-transparent to-primary/5" />
              <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
                <CarouselContent className="-ml-0">
                  {productShots.map((shot) => (
                    <CarouselItem key={shot.key} className="pl-0">
                      <div className="relative aspect-[3024/1548] w-full overflow-hidden rounded-xl border bg-card">
                        <img
                          src={shot.src}
                          alt={shot.alt}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['文档即工作流', '在同一页面完成写作、整理与执行'],
              ['一键导入', 'PDF / Markdown / Docx 结构化解析'],
              ['AI 问答与检索', '基于你的知识库回答，不胡说'],
              ['版本与发布', '内容可回溯，对外分享已发布版本'],
              ['团队协作', '共享空间、权限与结构化页面树'],
              ['任务进度可视化', '生成任务、实时进度与可取消'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-xl border bg-card p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="usecases" className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">三步上手</h2>
              <ol className="mt-4 space-y-3 text-muted-foreground">
                <li>1 导入资料：上传/粘贴/抓取</li>
                <li>2 自动整理：分段、标题层级、去噪</li>
                <li>3 提问与行动：回答、生成页面、生成任务并追踪</li>
              </ol>
              <div className="mt-6 flex gap-3">
                <Button onClick={enterApp}>免费开始</Button>
                <Button variant="outline" onClick={enterApp}>
                  申请演示
                </Button>
              </div>
            </div>
            {/* <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-card">
              <Image src="/file.svg" alt="步骤示意" fill className="object-contain p-10" />
            </div> */}
          </div>
        </section>

        <section id="ai" className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-xl border p-8">
            <h2 className="text-2xl font-semibold">你的知识库，才是 AI 的上下文</h2>
            <p className="mt-2 text-muted-foreground">
              向量检索 + 结构化分段 + 元数据过滤，回答可追溯。
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-6">
                <div className="text-sm font-semibold">普通聊天</div>
                <p className="mt-2 text-sm text-muted-foreground">泛泛而谈，缺少你的上下文与结构。</p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="text-sm font-semibold">Contexta</div>
                <p className="mt-2 text-sm text-muted-foreground">基于你的文档与页面树检索回答。</p>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border p-6">
              <h3 className="font-semibold">多租户隔离</h3>
              <p className="mt-2 text-sm text-muted-foreground">tenantId 隔离，数据边界明确。</p>
            </div>
            <div className="rounded-xl border p-6">
              <h3 className="font-semibold">版本与发布</h3>
              <p className="mt-2 text-sm text-muted-foreground">可回溯，支持发布对外阅读。</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-6">
              <div className="text-sm font-semibold">个人</div>
              <div className="mt-2 text-3xl font-bold">免费</div>
              <p className="mt-2 text-sm text-muted-foreground">用于个人知识管理与 AI 问答。</p>
              <div className="mt-6">
                <Button className="w-full" onClick={enterApp}>
                  免费开始
                </Button>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="text-sm font-semibold">团队</div>
              <div className="mt-2 text-3xl font-bold">联系销售</div>
              <p className="mt-2 text-sm text-muted-foreground">适合需要协作与权限的团队。</p>
              <div className="mt-6">
                <Button className="w-full" variant="outline" onClick={enterApp}>
                  申请演示
                </Button>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="text-sm font-semibold">企业</div>
              <div className="mt-2 text-3xl font-bold">定制</div>
              <p className="mt-2 text-sm text-muted-foreground">合规、审计、专属部署与 SLA。</p>
              <div className="mt-6">
                <Button className="w-full" variant="outline" onClick={enterApp}>
                  联系我们
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-xl border bg-muted/40 p-10 text-center">
            <h2 className="text-2xl font-semibold">现在开始，把知识变成生产力</h2>
            <p className="mt-2 text-muted-foreground">3 分钟完成首次导入与问答</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={enterApp}>免费开始</Button>
              <Button variant="outline" onClick={enterApp}>
                申请演示
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer id="help" className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold">产品</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#product" className="hover:text-foreground">功能</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground">价格</a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">更新日志</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">资源</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">帮助中心</a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">API</a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">模板</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">公司</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">关于</a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">隐私</a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">条款</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Contexta
          </div>
        </div>
      </footer>
    </div>
  );
}
