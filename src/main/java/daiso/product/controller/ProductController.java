package daiso.product.controller;

import javax.servlet.http.HttpServletRequest;

import daiso.common.annotation.DaisoController;
import daiso.common.annotation.DaisoGetMapping;
import daiso.common.annotation.DaisoRequestParam;
import daiso.common.annotation.DaisoResponseBody;

@DaisoController
public class ProductController {

	// 1. 일반 문자열 응답
	@DaisoGetMapping("/products")
	@DaisoResponseBody
	public String products() {
		return "상품 목록 조회 성공";
	}

	// 2. JSP 화면 반환
	@DaisoGetMapping("/products/page")
	public String page(HttpServletRequest request, @DaisoRequestParam("id") int id) {

		request.setAttribute("productId", id);

		return "products/detail";
	}

	// 3. 리다이렉트
	@DaisoGetMapping("/products/move")
	public String move() {
		return "redirect:/products";
	}
	
	@DaisoGetMapping("/products/detail") //매핑해주는거 즉, URL말하는거임
    public String detail(HttpServletRequest request, @DaisoRequestParam("id") int id) {

		//int id = Integer.parseInt(req.getParameter("id"));
		//@DaisoRequestParam("id") int id    <- 위랑 똑같은 거임 
        request.setAttribute("productId", id);

        return "products/detail";
    }
}