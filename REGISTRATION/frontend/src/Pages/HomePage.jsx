import React, { useEffect, useState } from "react";
import ButtonAppBar from "../Components/ButtonAppBar";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import Services from "../Api/Services";

function Home() {
  const [Data, setData] = useState([]);
  const [input, setInput] = useState({});

  const getRegistered = async () => {
    try {
      const response = await Services.get("/viewregistered");
      setData(response.data.Allregistered);
    } catch (error) {
      console.error("Error fetching registered data:", error);
    }
  };

  const addAccount = async (e) => {
    e.preventDefault();
    try {
      await Services.post("/createaccount", input);
      alert("Added Successfully!!");
      getRegistered();
    } catch (error) {
      console.error("Error adding account:", error);
      alert("Failed to add account");
    }
  };

  useEffect(() => {
    // Call the functions you want to execute on component mount
    getRegistered();
  }, []); // The empty dependency array means this useEffect runs once on mount

  const handleChange = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };
  return (
    <>
      <ButtonAppBar />
      <div className="container mt-4">
        <div className="row mt-4">
          <div className="col-lg-4">
            <input
              className="form-control mb-3"
              placeholder="firstName"
              onChange={handleChange}
              name="firstName"
            ></input>

            <input
              className="form-control mb-3"
              placeholder="lastName"
              onChange={handleChange}
              name="lastName"
            ></input>
            <input
              className="form-control mb-3"
              placeholder="email"
              onChange={handleChange}
              name="email"
            ></input>
            <input
              className="form-control mb-3"
              placeholder="phoneNumber"
              onChange={handleChange}
              name="phoneNumber"
            ></input>
            <input
              className="form-control mb-3"
              placeholder="gender"
              onChange={handleChange}
              name="gender"
            ></input>
            <Button variant="outlined" className="mb-4" onClick={addAccount}>
              Add Account
            </Button>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Gender</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {Data.map((c) => (
                <tr>
                  <td>{c.firstName}</td>
                  <td>{c.lastName}</td>
                  <td>{c.email}</td>
                  <td>{c.phoneNumber}</td>
                  <td>{c.gender}</td>
                  <th>
                    <Button
                      component={Link}
                      to={`/record/${c._id}`}
                      variant="outlined"
                    >
                      view
                    </Button>
                    {/* <a href={`/record/${c._id}`} className='btn btn-link'>
                    view
                  </a> */}
                  </th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Home;
