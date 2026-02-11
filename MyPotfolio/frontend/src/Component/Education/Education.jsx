import React from "react";
import "./education.css";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { FaGraduationCap } from "react-icons/fa";

const Education = () => {
  const data = [
    {
      name: "Oxford University",
      degree: "Bachelor of Science",
      year: "2014-2019",
      description: "I'm a bonifide graduate",
    },
    {
      name: "MIT University",
      degree: "Bachelor of Science",
      year: "2014-2019",
      description: "I'm a bonifide graduate",
    },
    {
      name: "Kogi State University",
      degree: "Bachelor of Science",
      year: "2014-2019",
      description: "I'm a bonifide graduate",
    },
  ];

  const colors = [
    "#F44336",
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
    <div className="container education-section" id="education">
      <div className="section-title">
        <h5>Education</h5>
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
              icon={<FaGraduationCap />}
            >
              <h3 className="vertical-timeline-element-title">{item.name}</h3>
              <h5
                className="vertical-timeline-element-subtitle"
                style={{ color: "yellow" }}
              >
                {item.degree}
              </h5>

              <p>{item.description}</p>
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>
      </div>
    </div>
  );
};

export default Education;
