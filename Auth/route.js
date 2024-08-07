const express = require("express");
const router = express.Router();

const { register, login, update, updateRole, deleteUser, deleteSelf, listUsers, userdata, check, changePassword, follow, unfollow } = require("./auth");
const { adminAuth, userAuth, checkAuth } = require("../middleware/auth");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/changePassword").post(userAuth, changePassword);
router.route("/update").put(userAuth, update);
router.route("/updateRole").put(adminAuth, updateRole);
router.route("/deleteUser").delete(adminAuth, deleteUser);
router.route("/deleteSelf").delete(userAuth, deleteSelf);
router.route("/listUsers").get(listUsers);
router.route("/check").get(checkAuth, check);
router.route("/userdata").get(userdata);
router.route("/follow").get(userAuth, follow);
router.route("/unfollow").get(userAuth, unfollow);

module.exports = router;
