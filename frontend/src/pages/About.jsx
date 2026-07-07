import Layout from "../components/Layout";

const teamMembers = [
  {
    name: "Mahesh",
    role: "IT Department Head",
    image: "mahesh.jpeg",
    description: "Oversees IT strategy, infrastructure and service delivery for the organization.",
    details: ["Planning IT operations", "Coordinating support teams", "Ensuring system uptime"],
  },
  {
    name: "Pradeep Wickramasinghe",
    role: "Programmer & System Analyst",
    image: "pradeep.jpeg",
    description: "Leads IT administration, optimization and security while overseeing strategic IT procurement, technical evaluations, and advanced troubleshooting at Geological Survey & Mines Bureau.",
    details: [
      "Advanced troubleshooting & tier-3 escalation",
      "IT procurement & technical evaluations",
      "Contract & lifecycle management",
      "7+ years experience in IT infrastructure"
    ],
  },
  {
    name: "Muthupavani Silva",
    role: "Network Hardware & Technical Assistant",
    image: "muthu.jpeg",
    description: "Supports network devices, hardware installation and technical troubleshooting.",
    details: ["Network setup", "Hardware maintenance", "On-site technical support"],
  },
  {
    name: "Priyanka Jayawardena",
    role: "Network Hardware & Technical Assistant",
    image: "priyanka.jpg",
    description: "Maintains network infrastructure and assists with hardware repairs and upgrades.",
    details: ["Switch/router support", "Cable management", "Technical assistance"],
  },
];

function About() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="dashboard-panel p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-600">About Us</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">IT Service Management Team</h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Our team manages IT service desk operations, asset tracking, helpdesk support and network
            infrastructure to keep the organization running smoothly.
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
