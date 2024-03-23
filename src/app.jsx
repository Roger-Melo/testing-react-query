import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const fetchUser = username => fetch(`https://api.github.com/users/${username}`)
  .then(res => res.json())
  .then(data => ({ id: data.id, name: data.name, avatarUrl: data.avatar_url }))

const UserPicker = ({ onChangeUser }) => usernames.map((_, i) =>
  <button key={usernames[i]} onClick={() => onChangeUser(i)}>Usuário {`${i + 1}`}</button>)

const User = ({ data, username }) =>
  <>
    <h1>Usuário {usernames.indexOf(username) + 1}: {data.name}</h1>
    <img src={data.avatarUrl} alt={`Foto de ${data.name}`} className="avatar" />
  </>

const usernames = ['Roger-Melo', 'ryanflorence', 'getify', 'gaearon']

const Users = () => {
  const [username, setUsername] = useState(usernames[0])
  const { isLoading, isError, isSuccess, error, data } = useQuery({
    queryKey: ['user', username],
    queryFn: () => fetchUser(username),
    refetchOnWindowFocus: false
  })

  const changeUser = i => setUsername(usernames[i])

  return (
    <>
      <UserPicker onChangeUser={changeUser} />
      {isLoading && <p>Carregando informações...</p>}
      {isError && <p>{error.message}</p>}
      {isSuccess && <User data={data} username={username} />}
    </>
  )
}

const App = () => <Users />

export { App }
