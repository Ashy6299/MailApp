import React, { useEffect, useState } from "react";
import Services from "../Api/Services";
import ButtonAppBar from "../Components/ButtonAppBar";
import "./homePage.css";

const MyHomePage = () => {
  const [Data, setData] = useState([]);

  const centresList = async () => {
    try {
      const response = await Services.get("/viewcentres");
      setData(response.data.TotalCreated);
    } catch (error) {
      console.error("Error fetching Centres data", error);
    }
  };

  useEffect(() => {
    centresList();
  }, []);

  return (
    <>
      <ButtonAppBar />
      {Data !== undefined ? (
        <div className="container mt-4">
          <div className="row ">
            <div className="col-xl-6 col-lg-6 col-md-4 col-sm-4 section">
              <h5>Total Number Of Centres Created:</h5>
              <p className="data text-end mt-3 fs-1 fw-bold">{Data}</p>
            </div>
            <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 section">
              <h5>Total Number Of Accounts Created:</h5>
            </div>
          </div>
        </div>
      ) : (
        <h4>No data</h4>
      )}
    </>
  );
};

export default MyHomePage;
