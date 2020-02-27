class MyService {
  async login(data, res) {

    const user = null;

    if (!user) {
      console.log('user doesnt exist', data.email);
      throw new Error('User.Error.WrongLogin');
    }

    return res.json({
      good: true
    });


  }
}

module.exports = new MyService();
