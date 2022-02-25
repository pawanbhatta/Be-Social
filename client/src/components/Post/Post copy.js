import { useState, useEffect, useContext, useRef } from "react";
import * as faceapi from "face-api.js";

import { Cancel, MoreVert } from "@material-ui/icons";
import "./styles.css";
import axios from "axios";
import { format } from "timeago.js";
import { useToast } from "@chakra-ui/toast";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import http from "http";
import { updatePostCall } from "../../apiCalls";

function Post({ post }) {
  const [like, setLike] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);

  const [showOption, setShowOption] = useState(false);

  const [user, setUser] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const [hasImage, setHasImage] = useState(post.image);
  const [desc, setDesc] = useState(post.desc);

  const PF = process.env.REACT_APP_PUBLIC_FOLDER;
  const SI = process.env.REACT_APP_GET_IMAGES;

  const { user: currentUser, dispatch, error } = useContext(AuthContext);
  const [currentPost, setCurrentPost] = useState(post);

  const toast = useToast();

  const downloadImage = async () => {
    // alert("Do you want to download this image");
    await http.get("/images/download/" + post.image);
  };

  useEffect(() => {
    setIsLiked(post.likes.includes(currentUser._id));
  }, [currentUser._id, post.likes]);

  const likeHandler = async () => {
    try {
      await axios.put(`/posts/${post._id}/like`, {
        userId: currentUser._id,
      });
    } catch (err) {
      console.log(err);
    }
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
  };

  const deleteHandler = async (e) => {
    setShowOption(false);
    try {
      await axios.delete(`/posts/${post._id}`, { userId: currentUser._id });
      window.location.reload();
    } catch (err) {
      console.log(err);
      dispatch({ type: "ERROR", payload: err });
    }
  };

  const updateHandler = async () => {
    setShowOption(false);
    if (post.userId === currentUser._id) {
      setIsUpdating(true);
    } else {
      dispatch({ type: "ERROR", payload: "You can update only your posts" });
    }
  };

  const updatePost = async (e) => {
    e.preventDefault();
    setIsUpdating(false);
    try {
      const info = {
        userId: currentUser._id,
        postId: post._id,
        desc,
        image: hasImage,
      };
      const newPost = await updatePostCall(info, dispatch);
      setCurrentPost(newPost);
    } catch (err) {
      console.log(err);
      dispatch({ type: "ERROR", payload: err });
    }
  };

  useEffect(() => {
    if (error) {
      toast({
        title: error,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      dispatch({ type: "ERROR", payload: "" });
    }
  }, [toast, dispatch, error]);

  useEffect(() => {
    axios
      .get(`/users/profile?userId=${post.userId}`)
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.log("Error Occurred ", err);
      });
    setCurrentPost(post);
  }, [post.userId, post]);

  const [image, setImage] = useState([]);
  const [faces, setFaces] = useState([]);

  // const imgRef = useRef();
  const canvasRef = useRef();

  const handleImage = async () => {
    const img = new Image();
    img.src = SI + "download/" + currentPost.image;
    img.onload = () => {
      setImage({
        url: img.src,
        width: img.width,
        height: img.height,
      });
    };

    // const image = http.get("/images/download/" + post.image);
    // const image = currentPost.image ? SI + "download/" + currentPost.image : "";

    console.log("got the image", image);

    // const { url, width, height } = image;

    const detections = faceapi
      .detectAllFaces(image.current)
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();

    // setFaces(detections.map((d) => Object.values(d.box)));
    // .withFaceLandmarks()
    // .withFaceExpressions();
    var width = image.clientWidth;
    var height = image.clientHeight;
    canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(image.current);
    faceapi.matchDimensions(canvasRef.current, { width, height });

    const resized = faceapi.resizeResults(detections, {
      width,
      height,
    });

    faceapi.draw.drawDetections(canvasRef.current, resized);
    faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
    faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

    setFaces(detections.map((d) => Object.values(d.box)))
      .withFaceExpressions()
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log("Faces Detected!!", faces);
  };

  const enter = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.linewidth = 5;
    ctx.strokeStyle = "yellow";
    faces.map((face) => ctx.strokeRect(...face));
  };

  useEffect(() => {
    const loadModels = async () => {
      Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ])
        .then(handleImage)
        .catch((e) => console.log(e));
    };

    image && loadModels();
  }, []);

  return (
    <div className="post">
      <div className="postWrapper">
        <div className="postTop">
          <div className="postTopLeft">
            <Link to={`profile/${user.username}`}>
              <img
                src={
                  user.profilePicture
                    ? SI + "download/" + user.profilePicture
                    : PF + "person/NoAvatarProfile.png"
                }
                className="postProfileImage"
                alt=""
              />
            </Link>
            <Link to={`profile/${user.username}`}>
              <span className="postUsername">{user.username}</span>
            </Link>
            <span className="postDate">{format(currentPost.createdAt)}</span>
          </div>
          <div className="postTopRight">
            <MoreVert
              className="postTopIcon"
              onClick={() => setShowOption(!showOption)}
            />
            {showOption ? (
              <div className="options">
                <span className="option" onClick={updateHandler}>
                  Update
                </span>
                <span className="option" onClick={deleteHandler}>
                  Delete
                </span>
                <hr />
                <span className="option">More</span>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        <div className="postCenter">
          {isUpdating ? (
            <form onSubmit={updatePost}>
              <input
                onChange={(e) => setDesc(e.target.value)}
                value={desc}
                type="text"
                id="desc"
                className="shareInput"
              />
              {hasImage && (
                <div className="shareImgContainer">
                  <img
                    className="shareImg"
                    src={
                      currentPost.image
                        ? SI + "download/" + currentPost.image
                        : ""
                    }
                    alt=""
                  />
                  <Cancel
                    className="shareCancelImg"
                    onClick={() => setHasImage("")}
                  />
                </div>
              )}
              <button className="updateButton" type="submit">
                Update
              </button>
            </form>
          ) : (
            <>
              <span className="postText">{currentPost?.desc}</span>
              <div
                className="left"
                style={{ width: image.width, height: image.height }}
              >
                <img crossOrigin="anonymous" src={image.url} alt="" />
                <canvas
                  onMouseEnter={enter}
                  ref={canvasRef}
                  width={image.width}
                  height={image.height}
                />
                {faces.map((face, i) => (
                  <input
                    name={`input${i}`}
                    style={{ left: face[0], top: face[1] + face[3] + 5 }}
                    placeholder="Tag a friend"
                    key={i}
                    className="friendInput"
                    // onChange={addFriend}
                  />
                ))}
              </div>
              {/* <img
                src={
                  currentPost.image ? SI + "download/" + currentPost.image : ""
                }
                className="postImage"
                alt=""
                loading="lazy"
                onClick={downloadImage}
              /> */}
            </>
          )}
        </div>
        <div className="postBottom">
          <div className="postBottomLeft">
            <img
              src={`${PF}like.png`}
              alt=""
              onClick={likeHandler}
              className="likeIcon"
            />
            <img
              src={`${PF}heart.png`}
              alt=""
              onClick={likeHandler}
              className="likeIcon"
            />
            <span className="postLikeCounter">{like} people liked it</span>
          </div>
          <div className="postBottomRight">
            <div className="postCommentText">
              {currentPost.comment} comments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post;
