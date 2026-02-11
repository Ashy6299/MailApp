import React from "react";
import "./project.css";
import ProjectList from "./ProjectList";

const Project = () => {
  const data = [
    {
      name: "MERN Stack Job Portal",
      description: "A job portal built using MERN stack",
      projectLink: "https://google.com",
      techUsed: [
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
      name: "MERN Stack Event Management Portal",
      description: "A job portal built using MERN stack",
      projectLink: "https://google.com",
      techUsed: [
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
      name: "MERN Social Media",
      description: "A job portal built using MERN stack",
      projectLink: "https://google.com",
      techUsed: [
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
      name: "MERN Stack Video Streaming",
      description: "A job portal built using MERN stack",
      projectLink: "https://google.com",
      techUsed: [
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
      name: "MERN Stack Job Portal",
      description: "A job portal built using MERN stack",
      projectLink: "https://google.com",
      techUsed: [
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
      name: "MERN Stack Job Portal",
      description: "A job portal built using MERN stack",
      projectLink: "https://google.com",
      techUsed: [
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

  return (
    <div className="container" id="projects">
      <div className="section-title">
        <h5>Projects</h5>
        <span className="line"></span>
      </div>
      <div className="row">
        {data.map((item, index) => (
          <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12" key={index}>
            <ProjectList {...item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Project;
