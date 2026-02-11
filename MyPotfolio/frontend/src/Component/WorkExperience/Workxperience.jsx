import React from "react";
import "./workXp.css";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { MdGroupWork } from "react-icons/md";

const Workxperience = () => {
  const data = [
    {
      companyName: "Joint Admissions And Matriculation Board",
      position: "Full Stack Developer",
      description: "A job portal built using MERN stack",
      year: "2021-till date",
      techSkills: [
        {
          techName: "Node Js",
        },
        {
          techName: "Express Js",
        },
        {
          techName: "React Js",
        },
        {
          techName: "Mongo Db",
        },
      ],
    },
    {
      companyName: "Diamond Cafe",
      position: "Full Stack Developer",
      description: "A job portal built using MERN stack",
      year: "2020-2021",
      techSkills: [
        {
          techName: "Node Js",
        },
        {
          techName: "Express Js",
        },
        {
          techName: "React Js",
        },
        {
          techName: "Mongo Db",
        },
      ],
    },
    {
      companyName: "SS Computers",
      position: "Full Stack Developer",
      description: "A job portal built using MERN stack",
      year: "2013-2015",
      techSkills: [
        {
          techName: "Node Js",
        },
        {
          techName: "Express Js",
        },
        {
          techName: "React Js",
        },
        {
          techName: "Mongo Db",
        },
      ],
    },
    {
      companyName: "YouTube",
      position: "Full Stack Developer",
      description: "A job portal built using MERN stack",
      year: "2013-2014",
      techSkills: [
        {
          techName: "Node Js",
        },
        {
          techName: "Express Js",
        },
        {
          techName: "React Js",
        },
        {
          techName: "Mongo Db",
        },
      ],
    },
    {
      companyName: "Facebook",
      position: "Full Stack Developer",
      description: "A job portal built using MERN stack",
      year: "2013-2014",
      techSkills: [
        {
          techName: "Node Js",
        },
        {
          techName: "Express Js",
        },
        {
          techName: "React Js",
        },
        {
          techName: "Mongo Db",
        },
      ],
    },
    {
      companyName: "Instagram",
      position: "Full Stack Developer",
      description: "A job portal built using MERN stack",
      year: "2013-2014",
      techSkills: [
        {
          techName: "Node Js",
        },
        {
          techName: "Express Js",
        },
        {
          techName: "React Js",
        },
        {
          techName: "Mongo Db",
        },
      ],
    },
    {
      companyName: "WhatsApp",
      position: "Full Stack Developer",
      description: "A job portal built using MERN stack",
      year: "2013-2014",
      techSkills: [
        {
          techName: "Node Js",
        },
        {
          techName: "Express Js",
        },
        {
          techName: "React Js",
        },
        {
          techName: "Mongo Db",
        },
      ],
    },
  ];

  const colors = [
    "#F44336",
    "#FFC0CB",
    "#A52A2A",
    "#F0E68C",
    "#8B4513",
    "#4169E1",
    "#7FFF00",
    "#FF6347",
    "#8A2BE2",
    "#DCDCDC",
    "#00CED1",
    "#FFD700",
    "#9400D3",
  ];

  return (
    <div className="container workexperience-section" id="work experience">
      <div className="section-title">
        <h5>Work Experience</h5>
        <span className="line"></span>
      </div>
      <div className="timeline-section">
        <VerticalTimeline lineColor="#ff1042">
          {data.map((item, index) => (
            <VerticalTimelineElement
              className="vertical-timeline-element--work"
              contentStyle={{ background: colors[index], color: "#fff" }}
              contentArrowStyle={{
                borderRight: "7px solid  rgb(33, 150, 243)",
              }}
              date={item.year}
              dateClassName="date-class"
              iconStyle={{ background: colors[index], color: "#fff" }}
              icon={<MdGroupWork />}
            >
              <h3 className="vertical-timeline-element-title">
                {item.companyName}
              </h3>
              <h4 className="vertical-timeline-element-subtitle">
                {item.position}
              </h4>

              <div className="row">
                {item.techSkills.map((tec, index) => (
                  <div
                    className="col-xl-4 col-lg-4 col-md-6 col-sm-12"
                    key={index}
                  >
                    <div className="tech-skills">
                      <p>{tec.techName}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p>{item.description}</p>
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>
      </div>
    </div>
  );
};

export default Workxperience;
