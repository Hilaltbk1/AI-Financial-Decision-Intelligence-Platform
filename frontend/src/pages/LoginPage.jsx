import { Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function LoginPage() {
  const {
    token,
    loginForm,
    setLoginForm,
    handleLogin,
    loginError,
    handleRegister,
    handleForgotPassword,
  } = useApp();

  const navigate = useNavigate();

  // login | register | forgot
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "register") {
      const success = await handleRegister(
        loginForm.username,
        email,
        loginForm.password
      );

      if (success) {
        setMode("login");

        setLoginForm({
          username: loginForm.username,
          password: "",
        });

        setEmail("");
      }

    } else if (mode === "forgot") {

      const success = await handleForgotPassword(email);

      if (success) {
        setMode("login");
        setEmail("");
      }

    } else {

      await handleLogin();

    }
  };


  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);


  return (
    <div
      className="min-h-screen flex items-center justify-center font-sans blueprint-grid"
      style={{ background: "#14161A" }}
    >

      <div
        className="p-10 rounded-[3rem] shadow-2xl border w-full max-w-sm space-y-8"
        style={{ background: "#1F2328", borderColor: "#33383F" }}
      >

        <div className="text-center space-y-2">

          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background:
                "linear-gradient(150deg,#FF6B35,#C1440E)",
            }}
          >

            <Activity
              color="#1A1300"
              size={28}
            />

          </div>


          <h1
            className="font-black text-xl italic"
            style={{ color:"#F2EFEA" }}
          >
            DecisionOS
          </h1>


          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8A8F98" }}>

            {
              mode === "register"
              ? "Yeni Hesap Oluştur"
              : mode === "forgot"
              ? "Şifremi Unuttum"
              : "Giriş Yapın"
            }

          </p>

        </div>



        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >


          {
            mode !== "forgot" && (

              <input
                type="text"
                placeholder="Kullanıcı Adı"
                value={loginForm.username}

                onChange={(e)=>
                  setLoginForm({
                    ...loginForm,
                    username:e.target.value
                  })
                }

                className="
                w-full
                rounded-2xl px-5 py-3
                outline-none font-bold text-sm
                "
                style={{ background: "#101214", border: "1px solid #33383F", color: "#F2EFEA" }}
              />

            )
          }



          {
            mode !== "login" && (

              <input
                type="email"
                placeholder="E-posta Adresi"
                value={email}

                onChange={(e)=>
                  setEmail(e.target.value)
                }

                className="
                w-full
                rounded-2xl px-5 py-3
                outline-none font-bold text-sm
                "
                style={{ background: "#101214", border: "1px solid #33383F", color: "#F2EFEA" }}
              />

            )
          }




          {
            mode !== "forgot" && (

              <input
                type="password"
                placeholder="Şifre"

                value={loginForm.password}

                onChange={(e)=>
                  setLoginForm({
                    ...loginForm,
                    password:e.target.value
                  })
                }

                className="
                w-full
                rounded-2xl px-5 py-3
                outline-none font-bold text-sm
                "
                style={{ background: "#101214", border: "1px solid #33383F", color: "#F2EFEA" }}
              />

            )
          }





          {
            loginError && (

              <p
                className="
                text-[10px]
                font-black
                uppercase
                text-center
                "
                style={{ color: "#D64545" }}
              >
                {loginError}
              </p>

            )
          }





          <button

            type="submit"

            className="
            w-full py-4
            rounded-2xl font-black
            uppercase text-[10px]
            tracking-widest transition
            "

            style={{
              background:
              "linear-gradient(150deg,#FF6B35,#C1440E)",
              color: "#1A1300"
            }}

          >

            {
              mode === "register"
              ? "Kayıt Ol"
              : mode === "forgot"
              ? "Bağlantı Gönder"
              : "Giriş Yap"
            }

          </button>


        </form>






        <div className="flex flex-col items-center space-y-3 text-[11px] font-bold">


          {
            mode === "login" && (

              <p

                onClick={()=>{
                  setMode("forgot");

                  setLoginForm({
                    username:"",
                    password:""
                  });

                  setEmail("");
                }}

                className="
                cursor-pointer
                transition hover:underline
                "

                style={{
                  color:"#8A8F98"
                }}

              >

                Şifremi Unuttum?

              </p>

            )
          }





          <p

            onClick={()=>{

              if(mode === "login"){
                setMode("register");
              }
              else{
                setMode("login");
              }


              setLoginForm({
                username:"",
                password:""
              });


              setEmail("");

            }}


            className="
            cursor-pointer
            transition hover:underline
            "

            style={{
              color:"#FF6B35"
            }}

          >

            {
              mode === "register"
              ? "Zaten hesabınız var mı? Giriş Yap"
              : mode === "forgot"
              ? "Geri Dön ve Giriş Yap"
              : "Hesabınız yok mu? Kayıt Ol"
            }


          </p>



        </div>


      </div>

    </div>
  );
}