import React from "react";
import "./Home.css";
import Typewriter from "typewriter-effect";
import MyCv from "./MyCV.pdf";

const Home = () => {
  return (
    <div className="container-fluid home" id="home">
      <div className="container home-content">
        <h1>Hi, i'm a</h1>
        <h3>
          <Typewriter
            options={{
              strings: [
                "Full Stack Software Developer",
                "Mern Stack Developer",
                "Web Developer",
                "UI/UX Designer",
                "Frontend Developer",
                "Computer Engineer",
              ],
              autoStart: true,
              loop: true,
            }}
          />
        </h3>
        <div className="button-for-action">
          <div className="hire-me-button">Hire Me</div>
          <div className="get-resume-button">
            <a href={MyCv} download="Adams CV">
              Get Resume
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
