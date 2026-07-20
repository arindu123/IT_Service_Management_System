import Layout from "../components/Layout";
import { useTranslation } from "../i18n/LanguageContext";

function About() {
  const { t } = useTranslation();

  const teamMembers = [
    {
      name: "Mahesh",
      role: t('about.members.maheshRole'),
      image: "mahesh.jpeg",
      description: t('about.members.maheshDescription'),
      details: [t('about.members.maheshDetail1'), t('about.members.maheshDetail2'), t('about.members.maheshDetail3')],
    },
    {
      name: "Pradeep Wickramasinghe",
      role: t('about.members.pradeepRole'),
      image: "pradeep.jpeg",
      description: t('about.members.pradeepDescription'),
      details: [
        t('about.members.pradeepDetail1'),
        t('about.members.pradeepDetail2'),
        t('about.members.pradeepDetail3'),
        t('about.members.pradeepDetail4'),
      ],
    },
    {
      name: "Buddika thilakarathna",
      role: t('about.members.priyankaRole'),
      image: "buddika.jpeg",
      description: t('about.members.priyankaDescription'),
      details: [t('about.members.priyankaDetail1'), t('about.members.priyankaDetail2'), t('about.members.priyankaDetail3')],
    },
    {
      name: "Muthupavani Silva",
      role: t('about.members.muthuRole'),
      image: "muthu.jpeg",
      description: t('about.members.muthuDescription'),
      details: [t('about.members.muthuDetail1'), t('about.members.muthuDetail2'), t('about.members.muthuDetail3')],
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="dashboard-panel p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-600">{t('about.eyebrow')}</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{t('about.title')}</h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            {t('about.description')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60"
            >
              <div className="relative h-72 overflow-hidden bg-slate-950">
                <img
                  src={`/team/${member.image}`}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent p-5 text-white">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{member.role}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">{member.name}</h2>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-6 text-slate-600">{member.description}</p>
                <div className="space-y-2">
                  {member.details.map((item) => (
                    <p key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-cyan-600" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default About;
