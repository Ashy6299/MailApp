import React from "react";
import SideBar from "./Component/sideBar/SideBar";
import About from "./Component/About/About";
import TechStack from "./Component/TechStack/TechStack";
import Project from "./Component/projects/Project";
import Workxperience from "./Component/WorkExperience/Workxperience";
import Education from "./Component/Education/Education";
import Contact from "./Component/contact/Contact";
import NavbarMobuleView from "./Component/sideBar/NavbarMobuleView";

export const App = () => {
  return (
    <>
      <NavbarMobuleView />
      <SideBar />
      <About />
      <Workxperience />
      <TechStack />
      <Education />
      <Project />
      <Contact />
    </>
  );
};

export default App;
