import React from "react";

function FooterPage() {
  return (
    <div className="p-5" style={{ backgroundColor: "#142d4c" }}>
      <div className="container" style={{ color: "#fafafa" }}>
        <h6>Powered by JAMB I.T.S</h6>
        <p>&copy; All rights reserved {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

export default FooterPage;
