"use client"

import Link from "next/link"
import { useT } from "@/lib/i18n"

export default function AboutPage() {
  const t = useT()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="prose prose-zinc dark:prose-invert max-w-none">
        <h1>{t("about.title")}</h1>

        <h2>{t("about.mission")}</h2>
        <p>{t("about.missionDesc")}</p>

        <h2>{t("about.corePhilosophy")}</h2>

        <h3>{t("about.scienceLearning")}</h3>
        <p>{t("about.scienceLearningDesc")}</p>

        <h3>{t("about.personalization")}</h3>
        <p>{t("about.personalizationDesc")}</p>

        <h3>{t("about.sustainability")}</h3>
        <p>{t("about.sustainabilityDesc")}</p>

        <h2>{t("about.techDriven")}</h2>
        <p>{t("about.techDrivenDesc")}</p>

        <h2>{t("about.contact")}</h2>
        <p>
          {t("about.contactDesc")}{" "}
          <a href="mailto:3427400856@qq.com" className="text-purple-500 hover:text-purple-600">3427400856@qq.com</a>
        </p>
      </article>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-purple-500 hover:text-purple-600 transition-colors">
          ← {t("about.backHome")}
        </Link>
      </div>
    </div>
  )
}
