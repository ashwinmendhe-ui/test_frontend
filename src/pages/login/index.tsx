import BgLogin from "@/assets/bg-login.png";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const handleLogin = async (values: LoginFormValues) => {
    const result = await login(values);

    if ("token" in result && result.token) {
      navigate("/dashboard");
      return;
    }

    messageApi.error(
      result?.message || "Invalid email or password. Please try again."
    );
  };

  const handleEnterPress = () => {
    form.submit();
  };

  return (
    <div
      className="w-screen min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${BgLogin})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {contextHolder}

      <div className="bg-white w-[522px] rounded-[26px] border border-[#E5E7EB] shadow-[5px_5px_19.8px_0px_#0000000F] px-[45px] py-[51px] flex flex-col items-center">
        <Form<LoginFormValues>
          layout="vertical"
          form={form}
          onFinish={handleLogin}
          className="flex flex-col gap-4"
          requiredMark={false}
        >
          <h2 className="text-[32px] font-semibold text-center mb-8 mt-0">
            LOGIN
          </h2>

          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please enter Email" },
              { type: "email", message: "Please enter a valid Email" },
            ]}
          >
            <Input
              placeholder="Email"
              className="w-[432px] h-[63px] rounded-2xl border border-gray-300 text-[16px] px-4"
              onPressEnter={handleEnterPress}
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter Password" }]}
          >
            <Input.Password
              placeholder="PASSWORD"
              className="w-[432px] h-[63px] rounded-2xl border border-gray-300 text-[16px] px-4"
              onPressEnter={handleEnterPress}
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item className="mb-0 pt-4 mt-8">
            <Button
            htmlType="submit"
            loading={loading}
            className="w-[432px]! h-[70px]! rounded-[26px]! bg-[#34C759]! hover:!bg-[#34C759]! text-white! font-semibold text-[18px] border-none! shadow-md"
          >
            LOGIN
          </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}