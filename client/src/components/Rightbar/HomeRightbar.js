import "./styles.css";
import { Users } from "../../dummyData";
import { Online } from "../index";
import { useEffect, useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { useCookies } from "react-cookie";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

function HomeRightbar({ onlineUsers }) {
  const PF = process.env.REACT_APP_PUBLIC_FOLDER;
  const SI = process.env.REACT_APP_GET_IMAGES;

  const [cookies] = useCookies(["jwt", "user"]);
  const { user } = cookies;

  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);

  useEffect(() => {
    const getFriends = async () => {
      const { data } = await axios.get("/users/friends/" + user._id);
      setFriends(data);
    };
    getFriends();
  }, [user._id]);

  useEffect(() => {
    setOnlineFriends(friends.filter((f) => onlineUsers.includes(f._id)));
  }, [friends, onlineUsers]);

  return (
    <div className="rightbar">
      <div className="rightbarWrapper">
        <div className="birthdayContainer">
          <img src={`${PF}gift.png`} alt="" className="birthdayImage" />
          <span className="birthdayText">
            <b>Puskar Raj Joshi</b> and <b> 3 other friends </b> have birthday
            today
          </span>
        </div>
        <img src={`${PF}ad.png`} alt="" className="rightbarAd" />
        <h4 className="rightbarTitle">Online Friends</h4>
        <ul className="rightbarFriendList">
          {onlineFriends.map((friend) => (
            <Link
              key={friend._id}
              to={"/profile/" + friend.username}
              style={{ textDecoration: "none" }}
            >
              <Online key={friend._id} user={friend} />
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default HomeRightbar;
