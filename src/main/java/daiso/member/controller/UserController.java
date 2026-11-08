package daiso.member.controller;

import daiso.common.annotation.DaisoController;
import daiso.common.annotation.DaisoGetMapping;

@DaisoController
public class UserController {

    @DaisoGetMapping("/users")
    public String findAllUsers() {
        return "회원 목록 조회 성공";
    }
}