import React, { useState } from "react";
import { FcExpand, FcCollapse } from "react-icons/fc";
import "./project.css";

const ProjectList = ({ name, description, projectLink, techUsed }) => {
  const [show, setShow] = useState(false);

  const handleShowAndCollapse = () => {
    setShow(!show);
  };

  return (
    <div
      className={show ? "project-list-opened project-list" : "project-list"}
      onClick={handleShowAndCollapse}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="title-and-collapse-option">
        <h3>{name}</h3>

        <p>{show ? <FcCollapse size={20} /> : <FcExpand size={20} />}</p>
      </div>
      {show ? (
        <p>{description}</p>
      ) : (
        <div className="description">
          <p>
            {description.substring(0, 10)}
            <b>...read more</b>
          </p>
        </div>
      )}

      <div className="row">
        {techUsed &&
          techUsed.map((tech, index) => (
            <div key={index} className="col-xl-3 col-lg-3 col-md-6 col-sm-12">
              <div className="tech-used-in-project">
                <p>{tech.techName}</p>
              </div>
            </div>
          ))}
      </div>
      <div className="live-demo-button">
        <a href={projectLink} target="_blank" rel="noopener noreferrer">
          Live Demo
        </a>
      </div>
    </div>
  );
};

export default ProjectList;
