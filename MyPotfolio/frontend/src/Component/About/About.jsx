import React from "react";
import "./About.css";
import ProfilePic from "../../Images/a.jpeg";

const About = () => {
  return (
    <div className="container about-section" id="about">
      <div className="row">
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
          <div className="about-image">
            <img src={ProfilePic} alt="Profile Photo" />
          </div>
        </div>
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
          <div className="about-details">
            <div className="about-title">
              <h5>About Me</h5>
              <span className="line"></span>
            </div>
            <p className="text">
              Hello! I'm Adams Ashraff Abubakar, a dynamic and results-driven
              individual with a passion for leveraging data and creativity to
              drive impactful marketing initiative. With a background in
              Mathematics Education from Kogi State University, I bring a unique
              blend of analytical prowess and strategic thinking to the table.
              My journey in the professional world began as a Data Analyst at SS
              Computers, where I honed my skills in data interpretation and
              analysis. The experience provided me with a solid foundation in
              understanding patterns and trends, which later applied to my roles
              in marketing. Transitioning into the realm of marketing, I served
              as a Marketing Coordinator at Relief Clinic Nagazi, where I
              spearheaded various campaigns aimed at raising awareness and
              engagement. Here, I discovered my knack for crafting compelling
              narratives and engaging with diverse audiences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
