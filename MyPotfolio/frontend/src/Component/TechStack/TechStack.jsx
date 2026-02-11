import React, { useState } from "react";
import "./techStack.css";

const TechStack = () => {
  const data = [
    {
      name: "Full Stack Developer",
    },
    {
      name: "Node js",
    },
    {
      name: "JavaScript",
    },
    {
      name: "Python",
    },
    {
      name: "Vanila js",
    },
    {
      name: "Vue js",
    },
    {
      name: "React js",
    },
    {
      name: "Next js",
    },
    {
      name: "Angular js",
    },
    {
      name: "Express js",
    },
    {
      name: "UI/UX Designer",
    },
    {
      name: "TypeScript",
    },
    {
      name: "Django",
    },
    {
      name: "Computer Engineer",
    },
  ];

  const colors = [
    "#FF0000",
    "#CD5C5C",
    "#00FF00",
    "#0000FF",
    "#00FFFF",
    "#FF00FF",
    "#000000",
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

  const [showMoreTechStack, setShowMoreTechStack] = useState(9);

  const loadMore = () => {
    setShowMoreTechStack((prev) => prev + 3);
  };

  return (
    <div className="container techStack-section" id="tech stack">
      <div className="section-title">
        <h5>Tech Stack</h5>
        <span className="line"></span>
      </div>

      <div className="row">
        {data.slice(0, showMoreTechStack).map((item, index) => (
          <div className="col-xl-4 col-lg-4 col-md-6 col-sm-14" key={index}>
            <div
              className={
                index === 0
                  ? "tech-content-marked tech-content"
                  : "tech-content"
              }
            >
              <span
                className="tech-number"
                style={{ backgroundColor: colors[index] }}
              >
                {index + 1}
              </span>
              <p>{item.name}</p>
            </div>
          </div>
        ))}
      </div>
      {showMoreTechStack >= data.length ? null : (
        <span className="load-more-techstack" onClick={loadMore}>
          Load More
        </span>
      )}
    </div>
  );
};

export default TechStack;
